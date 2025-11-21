import { Student, AttendanceRecord, ClassName, Subject, SchoolInfo, OperatorUser, Teacher } from '../types';

// This service manages all student and attendance data using IndexedDB,
// a permanent database within the user's browser. Data stored here
// will persist across browser sessions and will not be deleted unless
// the user manually clears their browser's site data.

const DB_NAME = 'SchoolDB';
const DB_VERSION = 6; // Incremented version for schema change
const STUDENTS_STORE = 'students';
const ATTENDANCE_STORE = 'attendanceRecords';
const SCHOOL_INFO_STORE = 'schoolInfo';
const SETTINGS_STORE = 'settings';
const OPERATOR_USERS_STORE = 'operatorUsers';
const TEACHERS_STORE = 'teachers';
const DATA_BACKUPS_STORE = 'dataBackups';


let dbPromise: Promise<IDBDatabase>;

const getDb = (): Promise<IDBDatabase> => {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STUDENTS_STORE)) {
                    const studentStore = db.createObjectStore(STUDENTS_STORE, { keyPath: 'id' });
                    studentStore.createIndex('class', 'class', { unique: false });
                }
                if (!db.objectStoreNames.contains(ATTENDANCE_STORE)) {
                    const attendanceStore = db.createObjectStore(ATTENDANCE_STORE, { keyPath: 'id' });
                    attendanceStore.createIndex('studentId_date_subject', ['studentId', 'date', 'subject'], { unique: true });
                    attendanceStore.createIndex('date', 'date', { unique: false });
                }
                if (!db.objectStoreNames.contains(SCHOOL_INFO_STORE)) {
                    db.createObjectStore(SCHOOL_INFO_STORE, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
                    db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
                }
                if (!db.objectStoreNames.contains(OPERATOR_USERS_STORE)) {
                    const operatorStore = db.createObjectStore(OPERATOR_USERS_STORE, { keyPath: 'id' });
                    operatorStore.createIndex('username', 'username', { unique: true });
                }
                 if (!db.objectStoreNames.contains(TEACHERS_STORE)) {
                    const teacherStore = db.createObjectStore(TEACHERS_STORE, { keyPath: 'id' });
                    teacherStore.createIndex('name', 'name', { unique: false });
                }
                 if (!db.objectStoreNames.contains(DATA_BACKUPS_STORE)) {
                    db.createObjectStore(DATA_BACKUPS_STORE, { keyPath: 'schoolName' });
                }
            };
        });
    }
    return dbPromise;
};

const promisifyRequest = <T>(request: IDBRequest<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const seedInitialData = async () => {
    const db = await getDb();
    
    // Seed Students
    const studentTx = db.transaction(STUDENTS_STORE, 'readwrite');
    const studentStore = studentTx.objectStore(STUDENTS_STORE);
    const studentCount = await promisifyRequest(studentStore.count());

    if (studentCount === 0) {
        console.log('Database is empty. Seeding initial student data for first-time use...');
        const studentsToSeed: { name: string; class: ClassName; nis?: string; parentPhoneNumber?: string }[] = [
            // Class X
            { name: 'Ahmad Azhari', nis: '0103935443', class: ClassName.X, parentPhoneNumber: '082273539769' },
            { name: 'Alfi Syahrin', nis: '0098534991', class: ClassName.X },
            { name: 'Azka Rahmatul Alifa', nis: '0107472953', class: ClassName.X, parentPhoneNumber: '085283571802' },
            { name: 'Benni Sahputra Pasaribu', nis: '0094391694', class: ClassName.X },
            { name: 'Echa Alfianinda', nis: '0095584888', class: ClassName.X },
            { name: 'Era Azilatul Ilmi', nis: '0095708801', class: ClassName.X, parentPhoneNumber: '087782073921' },
            { name: 'Fahrul Gunawan', nis: '0099330007', class: ClassName.X, parentPhoneNumber: '082377276253' },
            { name: 'Guti Yam', nis: '0104857993', class: ClassName.X, parentPhoneNumber: '082178672290' },
            { name: 'Hafizahtul Amanah', nis: '0082185732', class: ClassName.X, parentPhoneNumber: '082171288892' },
            { name: 'Iren Artika', nis: '0105215516', class: ClassName.X, parentPhoneNumber: '881262672032' },
            { name: 'Jesicamila Nduru', nis: '0072844813', class: ClassName.X, parentPhoneNumber: '082183257595' },
            { name: 'Marvel Juliandi', nis: '0096850586', class: ClassName.X, parentPhoneNumber: '081262267742' },
            { name: 'Melati Alhikma', nis: '0092553947', class: ClassName.X, parentPhoneNumber: '85362095862' },
            { name: 'Muhammad Anzikri', nis: '0101698736', class: ClassName.X, parentPhoneNumber: '081360736549' },
            { name: 'Najwatul Abidah MZ', nis: '0105292926', class: ClassName.X, parentPhoneNumber: '082361254163' },
            { name: 'Naura Sa\'diah', nis: '0097699623', class: ClassName.X, parentPhoneNumber: '082383739965' },
            { name: 'Norin Olivia', nis: '0085770092', class: ClassName.X, parentPhoneNumber: '85378094192' },
            { name: 'Nur Khadijah', nis: '0102049802', class: ClassName.X },
            { name: 'Nursehati', nis: '0076865638', class: ClassName.X },
            { name: 'Rafi Sastra', nis: '0095629971', class: ClassName.X, parentPhoneNumber: '085129497430' },
            { name: 'Rahmat Zulfata', nis: '0092915755', class: ClassName.X, parentPhoneNumber: '081377269840' },
            { name: 'Sabar Derita Gulo', nis: '0074531778', class: ClassName.X, parentPhoneNumber: '081363211156' },
            { name: 'Salsabila Arizka', nis: '0103574101', class: ClassName.X, parentPhoneNumber: '082310594838' },
            { name: 'Sinta Maysara', nis: '0108623080', class: ClassName.X },
            { name: 'Sinta Tanjung', nis: '0109039000', class: ClassName.X },
            { name: 'Siska Amanda Gea', nis: '0095517600', class: ClassName.X },
            { name: 'Siti Ranias', nis: '0082119572', class: ClassName.X },
            { name: 'Syaidatul Amna', nis: '0102694576', class: ClassName.X, parentPhoneNumber: '085371080172' },
            { name: 'Zilfatul Sakdiah', nis: '0107972777', class: ClassName.X, parentPhoneNumber: '08229841652' },
            { name: 'Jiyanul Akbar', nis: '0074269917', class: ClassName.X },
            // Class XI
            { name: 'Abi Febrian', class: ClassName.XI, nis: '0073181126' },
            { name: 'Afelnida Yanti', class: ClassName.XI, nis: '0092108468' },
            { name: 'Alfindra Kurnia', class: ClassName.XI, nis: '0099012145' },
            { name: 'Alif Azkiah', class: ClassName.XI, nis: '0082197573' },
            { name: 'Alwan El Hafiz', class: ClassName.XI, nis: '0086305775' },
            { name: 'Amanda Syari\'ah', class: ClassName.XI, nis: '0096133291' },
            { name: 'Azizul Akbar', class: ClassName.XI, nis: '0083166258' },
            { name: 'Faziya Rahmi', class: ClassName.XI, nis: '0084335310' },
            { name: 'Hermi Styawan', class: ClassName.XI, nis: '0083371960' },
            { name: 'Heni Sukma Nofianti', class: ClassName.XI, nis: '0097925875' },
            { name: 'Indrira Yulisfa', class: ClassName.XI, nis: '0095877225' },
            { name: 'Irdayanti', class: ClassName.XI, nis: '0073174321' },
            { name: 'Ismail Aqbad', class: ClassName.XI, nis: '0098647985' },
            { name: 'Khairul Arif', class: ClassName.XI, nis: '0097549519' },
            { name: 'Milsa Yani', class: ClassName.XI, nis: '0077268331' },
            { name: 'Rafael Hutabarat', class: ClassName.XI, nis: '0096106919' },
            { name: 'Rasifa Tul Makhfirah', class: ClassName.XI, nis: '0097710129' },
            { name: 'Sri Kartiwi', class: ClassName.XI, nis: '0071485115' },
            { name: 'Tegguh Ismail', class: ClassName.XI, nis: '0086541037' },
            { name: 'Vadli Atmaja', class: ClassName.XI, nis: '0087290422' },
            { name: 'Yazman Caniago', class: ClassName.XI, nis: '0089669702' },
            { name: 'Yofinda Kurnia', class: ClassName.XI, nis: '0084540242' },
            // Class XII-A
            { name: 'Alfa Yuda', class: ClassName.XIIA, nis: '0071557866', parentPhoneNumber: '081264292415' },
            { name: 'Asrafin', class: ClassName.XIIA, nis: '0071425999', parentPhoneNumber: '081262269396' },
            { name: 'Asmin', class: ClassName.XIIA, nis: '0037063296', parentPhoneNumber: '085285486331' },
            { name: 'Asyifa Muizza', class: ClassName.XIIA, nis: '0075518688', parentPhoneNumber: '081216180426' },
            { name: 'Cut Mutia', class: ClassName.XIIA, nis: '0088348572', parentPhoneNumber: '081372328168' },
            { name: 'Dava Algi Fahri', class: ClassName.XIIA, nis: '0008004755', parentPhoneNumber: '082267438190' },
            { name: 'Dela Amanda', class: ClassName.XIIA, nis: '0076181747', parentPhoneNumber: '081396864958' },
            { name: 'Elisa Purnama Sari', class: ClassName.XIIA, nis: '0072095086', parentPhoneNumber: '085298212751' },
            { name: 'Fikrial Hidayat Nduru', class: ClassName.XIIA, nis: '3057451069', parentPhoneNumber: '085216201965' },
            { name: 'Fahri Saifullah', class: ClassName.XIIA, nis: '0087812063', parentPhoneNumber: '085337318204' },
            { name: 'Jefri Ahmad Jamil Tanjung', class: ClassName.XIIA, nis: '0083521806', parentPhoneNumber: '081376711532' },
            { name: 'Khairiati', class: ClassName.XIIA, nis: '0079060933', parentPhoneNumber: '081262067157' },
            { name: 'Nabila Rahmadani', class: ClassName.XIIA, nis: '0076089877', parentPhoneNumber: '081260601944' },
            { name: 'Nisfa Ulmi Yani', class: ClassName.XIIA, nis: '0086332998', parentPhoneNumber: '085245249503' },
            { name: 'Noferlius Hia', class: ClassName.XIIA, nis: '0071684774' },
            { name: 'Pratama Mandala Putra', class: ClassName.XIIA, nis: '0078566271', parentPhoneNumber: '082312136352' },
            { name: 'Rezka Akbar Maulana', class: ClassName.XIIA, nis: '0085651824', parentPhoneNumber: '081247182802' },
            { name: 'Rolandi Kurniawan', class: ClassName.XIIA, nis: '0076644470', parentPhoneNumber: '081396864960' },
            { name: 'Riski Wandana', class: ClassName.XIIA, nis: '0062850510', parentPhoneNumber: '082171148676' },
            { name: 'Wirna Sari', class: ClassName.XIIA, nis: '0074181959', parentPhoneNumber: '082181470536' },
            // Class XII-B
            { name: 'Abimansyah', class: ClassName.XIIB, nis: '0078878314', parentPhoneNumber: '081263834124' }, 
            { name: 'Alfa Dinas', class: ClassName.XIIB, nis: '0076187762', parentPhoneNumber: '0812-6235-0637' },
            { name: 'Aril Man', class: ClassName.XIIB, nis: '0083718970', parentPhoneNumber: '2082130782163' }, 
            { name: 'Azmil Firansyah', class: ClassName.XIIB, nis: '0078720683', parentPhoneNumber: '085261106165' },
            { name: 'Anas Fadillah Putra', class: ClassName.XIIB, nis: '0076166111', parentPhoneNumber: '082273899895' }, { name: 'Darminsyah', class: ClassName.XIIB, nis: '0082456052' },
            { name: 'Ebi Annisa Fadhia', class: ClassName.XIIB, nis: '0087718234', parentPhoneNumber: '081264811636' }, 
            { name: 'Edo Mareska', class: ClassName.XIIB, nis: '0082636855', parentPhoneNumber: '082162347387' },
            { name: 'Farel Ananta', class: ClassName.XIIB, nis: '0072843753' }, 
            { name: 'Ferdi Sastra', class: ClassName.XIIB, nis: '0072843753', parentPhoneNumber: '082261003490' },
            { name: 'Iza Fadri', class: ClassName.XIIB, nis: '0083521806', parentPhoneNumber: '081376271014' }, 
            { name: 'Khairul Fahri', class: ClassName.XIIB, nis: '0082311040' },
            { name: 'Naisa Muadda', class: ClassName.XIIB, nis: '0075938624', parentPhoneNumber: '0812-7166-3968' }, 
            { name: 'Nesa Amanda', class: ClassName.XIIB, nis: '0073549159', parentPhoneNumber: '0823-6050-3341' },
            { name: 'Nur Aliza', class: ClassName.XIIB, nis: '0077901099', parentPhoneNumber: '082261089627' }, 
            { name: 'Rahmaulid', class: ClassName.XIIB, nis: '0072837051', parentPhoneNumber: '081260736609' },
            { name: 'Satria Gunawan', class: ClassName.XIIB, nis: '0089582299', parentPhoneNumber: '2082361848850' }, 
            { name: 'Siti Arda', class: ClassName.XIIB, nis: '0083188784' },
            { name: 'Talita Zarlina', class: ClassName.XIIB, nis: '0073040131', parentPhoneNumber: '082276127337' }, 
            { name: 'Vilsa Al Finda', class: ClassName.XIIB, nis: '0083322552', parentPhoneNumber: '0822-5611-3618' },
            { name: 'Yulia Vonni', class: ClassName.XIIB, nis: '0086346743' }, 
            { name: 'Zakwan Fauzan Utama', class: ClassName.XIIB, nis: '0086529212', parentPhoneNumber: '080269745023' },
        ];
        let nisCounter = 1;
        const promises = studentsToSeed.map(student => {
            const newStudent: Student = {
                id: `student-${Date.now()}-${nisCounter}`,
                name: student.name,
                nis: student.nis || `2024${String(nisCounter).padStart(4, '0')}`,
                class: student.class,
                parentPhoneNumber: student.parentPhoneNumber,
            };
            nisCounter++;
            return promisifyRequest(studentStore.add(newStudent));
        });
        await Promise.all(promises);
        console.log('Student seeding complete.');
    }

    // Seed School Info
    const schoolTx = db.transaction(SCHOOL_INFO_STORE, 'readwrite');
    const schoolStore = schoolTx.objectStore(SCHOOL_INFO_STORE);
    const schoolInfoCount = await promisifyRequest(schoolStore.count());

    if (schoolInfoCount === 0) {
        console.log('Seeding initial school info...');
        const initialSchoolInfo: SchoolInfo = {
            id: 1,
            name: "SMA NEGERI 1 PULAU BANYAK BARAT",
            address: "",
            headmaster: "",
            headmasterNip: "",
            logoBase64: null,
        };
        await promisifyRequest(schoolStore.add(initialSchoolInfo));
        console.log('School info seeding complete.');
    }
    
    // Seed Settings
    const settingsTx = db.transaction(SETTINGS_STORE, 'readwrite');
    const settingsStore = settingsTx.objectStore(SETTINGS_STORE);
    const passwordSetting = await promisifyRequest(settingsStore.get('adminPassword'));
    if (!passwordSetting) {
        console.log('Seeding initial settings...');
        await promisifyRequest(settingsStore.put({ key: 'adminPassword', value: 'admin123' }));
        await promisifyRequest(settingsStore.put({ key: 'attendanceSystemEnabled', value: true }));
        console.log('Settings seeding complete.');
    }

    // Seed Operators
    const operatorTx = db.transaction(OPERATOR_USERS_STORE, 'readwrite');
    const operatorStore = operatorTx.objectStore(OPERATOR_USERS_STORE);
    const operatorCount = await promisifyRequest(operatorStore.count());

    if (operatorCount === 0) {
        console.log('Seeding initial operator...');
        await promisifyRequest(operatorStore.put({ id: `operator-${Date.now()}`, username: 'absen', password: 'absen123' }));
        console.log('Operator seeding complete.');
    }
}

export const initializeDatabase = async () => {
    await getDb(); // ensures DB is open and upgraded if needed
    await seedInitialData();
};

export const dataService = {
    // Settings Management
    getSetting: async <T>(key: string): Promise<T | undefined> => {
        const db = await getDb();
        const tx = db.transaction(SETTINGS_STORE, 'readonly');
        const store = tx.objectStore(SETTINGS_STORE);
        const result = await promisifyRequest(store.get(key));
        return result ? result.value : undefined;
    },
    updateSetting: async <T>(key: string, value: T): Promise<void> => {
        const db = await getDb();
        const tx = db.transaction(SETTINGS_STORE, 'readwrite');
        const store = tx.objectStore(SETTINGS_STORE);
        await promisifyRequest(store.put({ key, value }));
    },

    // Operator User Management
    getOperatorUsers: async (): Promise<OperatorUser[]> => {
        const db = await getDb();
        const tx = db.transaction(OPERATOR_USERS_STORE, 'readonly');
        const store = tx.objectStore(OPERATOR_USERS_STORE);
        return promisifyRequest(store.getAll());
    },
    getOperatorUserByUsername: async (username: string): Promise<OperatorUser | undefined> => {
        const db = await getDb();
        const tx = db.transaction(OPERATOR_USERS_STORE, 'readonly');
        const store = tx.objectStore(OPERATOR_USERS_STORE);
        const index = store.index('username');
        return promisifyRequest(index.get(username));
    },
    addOperatorUser: async (username: string, password: string): Promise<OperatorUser> => {
        const db = await getDb();
        const tx = db.transaction(OPERATOR_USERS_STORE, 'readwrite');
        const store = tx.objectStore(OPERATOR_USERS_STORE);

        const existingUser = await promisifyRequest(store.index('username').get(username));
        if(existingUser) {
            throw new Error('Username sudah ada. Silakan gunakan username lain.');
        }

        const newUser: OperatorUser = {
            id: `operator-${Date.now()}`,
            username,
            password,
        };
        await promisifyRequest(store.add(newUser));
        return newUser;
    },
    updateOperatorUserPassword: async (id: string, newPassword: string): Promise<void> => {
        const db = await getDb();
        const tx = db.transaction(OPERATOR_USERS_STORE, 'readwrite');
        const store = tx.objectStore(OPERATOR_USERS_STORE);
        const user = await promisifyRequest(store.get(id));
        if (user) {
            user.password = newPassword;
            await promisifyRequest(store.put(user));
        } else {
            throw new Error("Pengguna tidak ditemukan.");
        }
    },
    deleteOperatorUser: async (id: string): Promise<void> => {
        const db = await getDb();
        const tx = db.transaction(OPERATOR_USERS_STORE, 'readwrite');
        const store = tx.objectStore(OPERATOR_USERS_STORE);
        await promisifyRequest(store.delete(id));
    },

    // Teacher Management
    getTeachers: async (): Promise<Teacher[]> => {
        const db = await getDb();
        const tx = db.transaction(TEACHERS_STORE, 'readonly');
        const store = tx.objectStore(TEACHERS_STORE);
        return promisifyRequest(store.getAll());
    },
    addTeacher: async (teacherData: Omit<Teacher, 'id'>): Promise<Teacher> => {
        const db = await getDb();
        const tx = db.transaction(TEACHERS_STORE, 'readwrite');
        const store = tx.objectStore(TEACHERS_STORE);
        const newTeacher: Teacher = {
            id: `teacher-${Date.now()}`,
            ...teacherData
        };
        await promisifyRequest(store.add(newTeacher));
        return newTeacher;
    },
    updateTeacher: async (id: string, updatedData: Partial<Omit<Teacher, 'id'>>): Promise<Teacher> => {
        const db = await getDb();
        const tx = db.transaction(TEACHERS_STORE, 'readwrite');
        const store = tx.objectStore(TEACHERS_STORE);
        const existingTeacher = await promisifyRequest(store.get(id));
        if (!existingTeacher) {
            throw new Error("Guru tidak ditemukan.");
        }
        const newTeacher: Teacher = { ...existingTeacher, ...updatedData };
        await promisifyRequest(store.put(newTeacher));
        return newTeacher;
    },
    deleteTeacher: async (id: string): Promise<void> => {
        const db = await getDb();
        const tx = db.transaction(TEACHERS_STORE, 'readwrite');
        const store = tx.objectStore(TEACHERS_STORE);
        await promisifyRequest(store.delete(id));
    },

    // School Info Management
    getSchoolInfo: async (): Promise<SchoolInfo | undefined> => {
        const db = await getDb();
        const tx = db.transaction(SCHOOL_INFO_STORE, 'readonly');
        const store = tx.objectStore(SCHOOL_INFO_STORE);
        return promisifyRequest(store.get(1)); // Always get the record with ID 1
    },
    updateSchoolInfo: async (updatedData: Partial<SchoolInfo>): Promise<SchoolInfo> => {
        const db = await getDb();
        const tx = db.transaction(SCHOOL_INFO_STORE, 'readwrite');
        const store = tx.objectStore(SCHOOL_INFO_STORE);
        const existingInfo = await promisifyRequest(store.get(1));
        if (!existingInfo) {
            throw new Error("School info not found. Cannot update.");
        }
        const newInfo: SchoolInfo = { ...existingInfo, ...updatedData };
        await promisifyRequest(store.put(newInfo));
        return newInfo;
    },
    
    checkForBackup: async (schoolName: string): Promise<boolean> => {
        const db = await getDb();
        const tx = db.transaction(DATA_BACKUPS_STORE, 'readonly');
        const store = tx.objectStore(DATA_BACKUPS_STORE);
        const backup = await promisifyRequest(store.get(schoolName));
        return !!backup;
    },

    backupAndResetData: async (oldSchoolName: string): Promise<void> => {
        const db = await getDb();
        
        // Use a single transaction for reading to ensure data consistency
        const readTx = db.transaction([STUDENTS_STORE, TEACHERS_STORE], 'readonly');
        const studentStoreRead = readTx.objectStore(STUDENTS_STORE);
        const teacherStoreRead = readTx.objectStore(TEACHERS_STORE);

        const allStudents = await promisifyRequest(studentStoreRead.getAll());
        const allTeachers = await promisifyRequest(teacherStoreRead.getAll());
        
        await new Promise(resolve => readTx.oncomplete = resolve);

        const backupData = {
            schoolName: oldSchoolName,
            students: allStudents,
            teachers: allTeachers,
        };

        const writeTx = db.transaction([STUDENTS_STORE, TEACHERS_STORE, DATA_BACKUPS_STORE], 'readwrite');
        const studentStoreWrite = writeTx.objectStore(STUDENTS_STORE);
        const teacherStoreWrite = writeTx.objectStore(TEACHERS_STORE);
        const backupStoreWrite = writeTx.objectStore(DATA_BACKUPS_STORE);
        
        await promisifyRequest(backupStoreWrite.put(backupData));
        await promisifyRequest(studentStoreWrite.clear());
        await promisifyRequest(teacherStoreWrite.clear());
    },

    restoreDataFromBackup: async (schoolName: string): Promise<void> => {
        const db = await getDb();
        const tx = db.transaction([STUDENTS_STORE, TEACHERS_STORE, DATA_BACKUPS_STORE], 'readwrite');
        const studentStore = tx.objectStore(STUDENTS_STORE);
        const teacherStore = tx.objectStore(TEACHERS_STORE);
        const backupStore = tx.objectStore(DATA_BACKUPS_STORE);

        const backup = await promisifyRequest(backupStore.get(schoolName));
        if (!backup) {
            console.warn(`No backup found for school name: ${schoolName}`);
            return;
        }

        // Restore data
        await promisifyRequest(studentStore.clear());
        await promisifyRequest(teacherStore.clear());

        const studentPromises = backup.students.map((student: Student) => 
            promisifyRequest(studentStore.add(student))
        );
        const teacherPromises = backup.teachers.map((teacher: Teacher) => 
            promisifyRequest(teacherStore.add(teacher))
        );
        
        await Promise.all([...studentPromises, ...teacherPromises]);
        
        // Delete the used backup
        await promisifyRequest(backupStore.delete(schoolName));
    },

    // Student Management
    getStudents: async (className?: ClassName): Promise<Student[]> => {
        const db = await getDb();
        const tx = db.transaction(STUDENTS_STORE, 'readonly');
        const store = tx.objectStore(STUDENTS_STORE);

        if (className) {
            const index = store.index('class');
            return promisifyRequest(index.getAll(className));
        }
        return promisifyRequest(store.getAll());
    },
    getStudentById: async (id: string): Promise<Student | undefined> => {
        const db = await getDb();
        const tx = db.transaction(STUDENTS_STORE, 'readonly');
        const store = tx.objectStore(STUDENTS_STORE);
        return promisifyRequest(store.get(id));
    },
    addStudent: async (name: string, nis: string, className: ClassName, parentPhoneNumber?: string): Promise<Student> => {
        const db = await getDb();
        const tx = db.transaction(STUDENTS_STORE, 'readwrite');
        const store = tx.objectStore(STUDENTS_STORE);
        const newStudent: Student = {
            id: `student-${Date.now()}`,
            name,
            nis,
            class: className,
            parentPhoneNumber,
        };
        await promisifyRequest(store.add(newStudent));
        return newStudent;
    },
    updateStudent: async (id: string, updatedData: { name: string, nis: string, className: ClassName, parentPhoneNumber?: string }): Promise<Student | undefined> => {
        const db = await getDb();
        const tx = db.transaction(STUDENTS_STORE, 'readwrite');
        const store = tx.objectStore(STUDENTS_STORE);
        const student = await promisifyRequest(store.get(id));
        if (student) {
            const updatedStudent: Student = {
                ...student,
                name: updatedData.name,
                nis: updatedData.nis,
                class: updatedData.className,
                parentPhoneNumber: updatedData.parentPhoneNumber,
            };
            await promisifyRequest(store.put(updatedStudent));
            return updatedStudent;
        }
        return undefined;
    },
    deleteStudent: async (id: string): Promise<void> => {
        const db = await getDb();
        const tx = db.transaction(STUDENTS_STORE, 'readwrite');
        const store = tx.objectStore(STUDENTS_STORE);
        await promisifyRequest(store.delete(id));
    },

    // Attendance Management
    getAttendanceRecords: async (filters: { className?: ClassName, subject?: Subject, month?: number, year?: number }): Promise<AttendanceRecord[]> => {
        const db = await getDb();
        const tx = db.transaction([ATTENDANCE_STORE, STUDENTS_STORE], 'readonly');
        const attendanceStore = tx.objectStore(ATTENDANCE_STORE);
        const allRecords = await promisifyRequest(attendanceStore.getAll());
        
        // Manual filtering since IndexedDB queries for complex filters can be tricky.
        const filteredRecords = [];
        for (const record of allRecords) {
            const recordDate = new Date(record.date);
            const student = await dataService.getStudentById(record.studentId);
            if (!student) continue;

            const classMatch = !filters.className || student.class === filters.className;
            const subjectMatch = !filters.subject || record.subject === filters.subject;
            const monthMatch = !filters.month || recordDate.getUTCMonth() === filters.month - 1;
            const yearMatch = !filters.year || recordDate.getUTCFullYear() === filters.year;


            if (classMatch && subjectMatch && monthMatch && yearMatch) {
                filteredRecords.push(record);
            }
        }
        return filteredRecords;
    },

    recordAttendance: async (studentId: string, subject: Subject, attendanceDateTime: Date, scanMode: 'check-in' | 'check-out', timeliness?: 'on-time' | 'late', semester?: 'Ganjil' | 'Genap'): Promise<{ record: AttendanceRecord, type: 'check-in' | 'check-out' }> => {
        const db = await getDb();
        const tx = db.transaction(ATTENDANCE_STORE, 'readwrite');
        const store = tx.objectStore(ATTENDANCE_STORE);
        const index = store.index('studentId_date_subject');
        
        // Use local date components to avoid timezone issues.
        const year = attendanceDateTime.getFullYear();
        const month = String(attendanceDateTime.getMonth() + 1).padStart(2, '0');
        const day = String(attendanceDateTime.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        const existingRecord = await promisifyRequest(index.get([studentId, dateStr, subject]));
        
        if (existingRecord && existingRecord.status !== 'present') {
            throw new Error(`Siswa sudah tercatat '${existingRecord.status === 'sick' ? 'Sakit' : 'Izin'}' dan tidak dapat melakukan absensi.`);
        }

        if (scanMode === 'check-in') {
            if (existingRecord) {
                throw new Error("Siswa sudah tercatat absen masuk untuk mata pelajaran ini pada tanggal yang dipilih.");
            }
            // Check-in
            const newRecord: AttendanceRecord = {
                id: `att-${Date.now()}`,
                studentId,
                subject,
                status: 'present',
                checkIn: attendanceDateTime.toISOString(),
                checkOut: null,
                date: dateStr,
                timeliness: timeliness,
                semester,
            };
            await promisifyRequest(store.add(newRecord));
            return { record: newRecord, type: 'check-in' };

        } else { // scanMode === 'check-out'
            if (!existingRecord) {
                throw new Error("Siswa belum melakukan absen masuk untuk mata pelajaran ini pada tanggal yang dipilih.");
            }
            if (existingRecord.checkOut !== null) {
                throw new Error("Siswa sudah melakukan absen pulang untuk mata pelajaran ini pada tanggal yang dipilih.");
            }
            // Check-out
            existingRecord.checkOut = attendanceDateTime.toISOString();
            if (semester && !existingRecord.semester) {
                existingRecord.semester = semester;
            }
            await promisifyRequest(store.put(existingRecord));
            return { record: existingRecord, type: 'check-out' };
        }
    },

    setManualAttendance: async (studentId: string, subject: Subject, date: string, status: 'sick' | 'permission' | null, semester?: 'Ganjil' | 'Genap'): Promise<void> => {
        const db = await getDb();
        const tx = db.transaction(ATTENDANCE_STORE, 'readwrite');
        const store = tx.objectStore(ATTENDANCE_STORE);
        const index = store.index('studentId_date_subject');
        
        const existingRecord = await promisifyRequest(index.get([studentId, date, subject]));
    
        if (status) { // Setting to 'sick' or 'permission'
            if (existingRecord && existingRecord.status === 'present') {
                throw new Error("Gagal menyimpan: Siswa sudah tercatat hadir (scan QR).");
            }
            const record: AttendanceRecord = {
                id: existingRecord?.id || `att-${Date.now()}`,
                studentId,
                subject,
                date,
                status,
                checkIn: null,
                checkOut: null,
                semester,
            };
            await promisifyRequest(store.put(record));
        } else { // Reverting to 'Alpa' by deleting the record
            if (existingRecord && existingRecord.status !== 'present') {
                await promisifyRequest(store.delete(existingRecord.id));
            }
            // If the record is 'present' or doesn't exist, do nothing.
        }
    },
};