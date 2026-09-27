/* ============================================================
   طبقة البيانات — بديل خادم Flask، كل حاجة بتتخزن في المتصفح
   (localStorage) من غير أي سيرفر أو قاعدة بيانات خارجية.
   ============================================================ */

const DB = (() => {
    const KEYS = {
        users: "clinic_users",
        patients: "clinic_patients",
        services: "clinic_services",
        visits: "clinic_visits",
        counters: "clinic_counters",
        session: "clinic_session",
        expenses: "clinic_expenses",
    };

    function read(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    }
    function write(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function nextId(name) {
        const counters = read(KEYS.counters, {});
        counters[name] = (counters[name] || 0) + 1;
        write(KEYS.counters, counters);
        return counters[name];
    }

    // SHA-256 مكتوب بجافاسكريبت عادي (من غير crypto.subtle) عشان يشتغل
    // حتى لو الملف اتفتح مباشرة من الجهاز (file://) واللي فيه المتصفحات
    // بتمنع Web Crypto لأنه مش "secure context".
    function sha256Hex(message) {
        const K = [
            0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
            0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
            0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
            0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
            0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
            0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
            0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
            0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2,
        ];
        let h0=0x6a09e667,h1=0xbb67ae85,h2=0x3c6ef372,h3=0xa54ff53a,h4=0x510e527f,h5=0x9b05688c,h6=0x1f83d9ab,h7=0x5be0cd19;
        const rotr = (x, n) => (x >>> n) | (x << (32 - n));
        const bytes = new TextEncoder().encode(message);
        const bitLen = bytes.length * 8;
        const padded = new Uint8Array(((bytes.length + 9 + 63) >> 6) << 6);
        padded.set(bytes);
        padded[bytes.length] = 0x80;
        const dv = new DataView(padded.buffer);
        dv.setUint32(padded.length - 4, bitLen >>> 0, false);
        dv.setUint32(padded.length - 8, Math.floor(bitLen / 0x100000000), false);
        const w = new Uint32Array(64);
        for (let chunk = 0; chunk < padded.length; chunk += 64) {
            for (let i = 0; i < 16; i++) w[i] = dv.getUint32(chunk + i * 4, false);
            for (let i = 16; i < 64; i++) {
                const s0 = rotr(w[i-15],7) ^ rotr(w[i-15],18) ^ (w[i-15]>>>3);
                const s1 = rotr(w[i-2],17) ^ rotr(w[i-2],19) ^ (w[i-2]>>>10);
                w[i] = (w[i-16] + s0 + w[i-7] + s1) | 0;
            }
            let a=h0,b=h1,c=h2,d=h3,e=h4,f=h5,g=h6,h=h7;
            for (let i = 0; i < 64; i++) {
                const S1 = rotr(e,6) ^ rotr(e,11) ^ rotr(e,25);
                const ch = (e & f) ^ (~e & g);
                const temp1 = (h + S1 + ch + K[i] + w[i]) | 0;
                const S0 = rotr(a,2) ^ rotr(a,13) ^ rotr(a,22);
                const maj = (a & b) ^ (a & c) ^ (b & c);
                const temp2 = (S0 + maj) | 0;
                h=g; g=f; f=e; e=(d+temp1)|0; d=c; c=b; b=a; a=(temp1+temp2)|0;
            }
            h0=(h0+a)|0; h1=(h1+b)|0; h2=(h2+c)|0; h3=(h3+d)|0;
            h4=(h4+e)|0; h5=(h5+f)|0; h6=(h6+g)|0; h7=(h7+h)|0;
        }
        return [h0,h1,h2,h3,h4,h5,h6,h7].map((n) => (n >>> 0).toString(16).padStart(8, "0")).join("");
    }
    async function hashPassword(password, salt) {
        return sha256Hex(salt + ":" + password);
    }
    function randomSalt() {
        const arr = crypto.getRandomValues(new Uint8Array(12));
        return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
    }

    const defaultServices = () => [
        ["كشف", 0], ["حشو عادي", 0], ["حشو تجميلي", 0],
        ["خلع سنة عادي", 0], ["خلع ضرس عقل", 0], ["تنظيف جير", 0],
        ["علاج عصب (جلسة)", 0], ["تركيبة/تاج", 0], ["تبييض", 0],
    ];

    async function ensureSeed() {
        const users = read(KEYS.users, []);
        if (users.length === 0) {
            // مفيش صفحة "إنشاء حساب" في التطبيق ده، فالدخول بيتم بالحساب الثابت ده بس
            const salt = randomSalt();
            const passwordHash = await hashPassword("system samar", salt);
            users.push({
                id: nextId("users"),
                username: "d/samar",
                salt,
                passwordHash,
                failedAttempts: 0,
            });
            write(KEYS.users, users);
        }
        const services = read(KEYS.services, null);
        if (services === null) {
            const seeded = defaultServices().map(([name, price]) => ({
                id: nextId("services"),
                name,
                default_price: price,
            }));
            write(KEYS.services, seeded);
        }
        if (read(KEYS.patients, null) === null) write(KEYS.patients, []);
        if (read(KEYS.visits, null) === null) write(KEYS.visits, []);
    }

    // ---------- المستخدمون ----------
    const Users = {
        count: () => read(KEYS.users, []).length,
        all: () => read(KEYS.users, []),
        findByUsername: (username) => read(KEYS.users, []).find(
            (u) => u.username.toLowerCase() === (username || "").toLowerCase()
        ),
        getById: (id) => read(KEYS.users, []).find((u) => u.id === id),
        async create(username, password) {
            const users = read(KEYS.users, []);
            const salt = randomSalt();
            const passwordHash = await hashPassword(password, salt);
            const user = { id: nextId("users"), username, salt, passwordHash, failedAttempts: 0 };
            users.push(user);
            write(KEYS.users, users);
            return user;
        },
        async checkPassword(user, password) {
            const h = await hashPassword(password, user.salt);
            return h === user.passwordHash;
        },
        async setPassword(user, newPassword) {
            const users = read(KEYS.users, []);
            const target = users.find((u) => u.id === user.id);
            target.salt = randomSalt();
            target.passwordHash = await hashPassword(newPassword, target.salt);
            write(KEYS.users, users);
        },
        registerFailure(user) {
            const users = read(KEYS.users, []);
            const target = users.find((u) => u.id === user.id);
            target.failedAttempts = (target.failedAttempts || 0) + 1;
            write(KEYS.users, users);
            return target.failedAttempts;
        },
        resetFailures(user) {
            const users = read(KEYS.users, []);
            const target = users.find((u) => u.id === user.id);
            target.failedAttempts = 0;
            write(KEYS.users, users);
        },
    };

    // ---------- الجلسة ----------
    const Session = {
        login(userId) { write(KEYS.session, { userId }); },
        logout() { localStorage.removeItem(KEYS.session); },
        currentUser() {
            const s = read(KEYS.session, null);
            if (!s) return null;
            return Users.getById(s.userId) || null;
        },
    };

    // ---------- المرضى ----------
    const Patients = {
        all: (opts = {}) => {
            const list = read(KEYS.patients, []);
            return opts.includeArchived ? list : list.filter((p) => !p.archived);
        },
        archivedList: () => read(KEYS.patients, []).filter((p) => p.archived),
        getById: (id) => read(KEYS.patients, []).find((p) => p.id === id),
        findByPhone(phone, excludeId = null) {
            if (!phone) return null;
            return Patients.all().find((p) => p.phone === phone && p.id !== excludeId) || null;
        },
        create(data) {
            const patients = read(KEYS.patients, []);
            const patient = {
                id: nextId("patients"),
                full_name: data.full_name || "",
                phone: data.phone || "",
                age: data.age || null,
                gender: data.gender || "",
                address: data.address || "",
                medical_notes: data.medical_notes || "",
                teeth: {},
                photos: [],
                created_at: new Date().toISOString(),
            };
            patients.push(patient);
            write(KEYS.patients, patients);
            return patient;
        },
        update(id, data) {
            const patients = read(KEYS.patients, []);
            const p = patients.find((x) => x.id === id);
            Object.assign(p, data);
            write(KEYS.patients, patients);
            return p;
        },
        // حذف "ناعم": المريض بيتنقل للأرشيف وممكن يترجع تاني، مش بيتمسح فعليًا
        remove(id) {
            const patients = read(KEYS.patients, []);
            const p = patients.find((x) => x.id === id);
            if (p) { p.archived = true; p.archived_at = new Date().toISOString(); }
            write(KEYS.patients, patients);
        },
        restore(id) {
            const patients = read(KEYS.patients, []);
            const p = patients.find((x) => x.id === id);
            if (p) { delete p.archived; delete p.archived_at; }
            write(KEYS.patients, patients);
        },
        // حذف نهائي فعلي (من صفحة الأرشيف فقط) — بيمسح زياراته كمان
        purge(id) {
            write(KEYS.patients, read(KEYS.patients, []).filter((p) => p.id !== id));
            write(KEYS.visits, read(KEYS.visits, []).filter((v) => v.patient_id !== id));
        },
        search(q) {
            q = (q || "").trim().toLowerCase();
            let list = Patients.all();
            if (q) {
                list = list.filter(
                    (p) => (p.full_name || "").toLowerCase().includes(q) || (p.phone || "").includes(q)
                );
            }
            return list.sort((a, b) => a.full_name.localeCompare(b.full_name, "ar"));
        },
    };

    // ---------- الخدمات ----------
    const Services = {
        all: () => read(KEYS.services, []).sort((a, b) => a.name.localeCompare(b.name, "ar")),
        getById: (id) => read(KEYS.services, []).find((s) => s.id === id),
        create(name, price) {
            const services = read(KEYS.services, []);
            const service = { id: nextId("services"), name, default_price: price };
            services.push(service);
            write(KEYS.services, services);
            return service;
        },
        update(id, name, price) {
            const services = read(KEYS.services, []);
            const s = services.find((x) => x.id === id);
            s.name = name;
            s.default_price = price;
            write(KEYS.services, services);
        },
        remove(id) {
            write(KEYS.services, read(KEYS.services, []).filter((s) => s.id !== id));
        },
    };

    // ---------- الزيارات ----------
    const Visits = {
        all: (opts = {}) => {
            const list = read(KEYS.visits, []);
            return opts.includeArchived ? list : list.filter((v) => !v.archived);
        },
        archivedList: () => read(KEYS.visits, []).filter((v) => v.archived),
        getById: (id) => read(KEYS.visits, []).find((v) => v.id === id),
        forPatient(patientId) {
            return Visits.all()
                .filter((v) => v.patient_id === patientId)
                .sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));
        },
        create(data) {
            const visits = read(KEYS.visits, []);
            const visit = { id: nextId("visits"), ...data };
            visits.push(visit);
            write(KEYS.visits, visits);
            return visit;
        },
        // حذف "ناعم": الزيارة بتتنقل للأرشيف وممكن ترجع تاني
        remove(id) {
            const visits = read(KEYS.visits, []);
            const v = visits.find((x) => x.id === id);
            if (v) { v.archived = true; v.archived_at = new Date().toISOString(); }
            write(KEYS.visits, visits);
            return v ? v.patient_id : null;
        },
        restore(id) {
            const visits = read(KEYS.visits, []);
            const v = visits.find((x) => x.id === id);
            if (v) { delete v.archived; delete v.archived_at; }
            write(KEYS.visits, visits);
        },
        purge(id) {
            write(KEYS.visits, read(KEYS.visits, []).filter((x) => x.id !== id));
        },
        upcoming(days = 3) {
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const soon = new Date(today); soon.setDate(soon.getDate() + days);
            return Visits.all()
                .filter((v) => v.next_visit_date)
                .filter((v) => {
                    const d = new Date(v.next_visit_date);
                    return d >= today && d <= soon;
                })
                .sort((a, b) => new Date(a.next_visit_date) - new Date(b.next_visit_date));
        },
    };

    // ---------- نسخ احتياطي / استعادة ----------
    // ---------- المصروفات ----------
    const Expenses = {
        all: () => read(KEYS.expenses, []).sort((a, b) => new Date(b.date) - new Date(a.date)),
        create(data) {
            const list = read(KEYS.expenses, []);
            const expense = {
                id: nextId("expenses"),
                description: data.description || "",
                amount: data.amount || 0,
                date: data.date,
                created_at: new Date().toISOString(),
            };
            list.push(expense);
            write(KEYS.expenses, list);
            return expense;
        },
        remove(id) {
            write(KEYS.expenses, read(KEYS.expenses, []).filter((e) => e.id !== id));
        },
    };

    const Backup = {
        exportData() {
            return {
                exported_at: new Date().toISOString(),
                app: "عيادة د. سمر مجدي الاسكندراني",
                data: {
                    users: read(KEYS.users, []),
                    patients: read(KEYS.patients, []),
                    services: read(KEYS.services, []),
                    visits: read(KEYS.visits, []),
                    counters: read(KEYS.counters, {}),
                    expenses: read(KEYS.expenses, []),
                },
            };
        },
        importData(payload) {
            if (!payload || !payload.data) throw new Error("bad file");
            const { users, patients, services, visits, counters, expenses } = payload.data;
            write(KEYS.users, users || []);
            write(KEYS.patients, patients || []);
            write(KEYS.services, services || []);
            write(KEYS.visits, visits || []);
            write(KEYS.counters, counters || {});
            write(KEYS.expenses, expenses || []);
        },
    };

    return { KEYS, ensureSeed, Users, Session, Patients, Services, Visits, Expenses, Backup };
})();
