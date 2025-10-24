import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'AppDataDB';
const DB_VERSION = 1;

interface UserData {
    userId: string;
    name: string;
    email: string;
    lastLoginAt: Date;
    currentSessionId: string | null;
}

interface TimeSettings {
    totalEnabled: boolean;
    totalMinutes?: number;
    perQuestionEnabled: boolean;
    perQuestionSeconds?: number;
}

interface SessionData {
    sessionId: string;
    userId: string;
    category: string;
    categoryDescription: string;
    subcategory: string;
    subcategoryDescription: string;
    quizSlugId: string;
    questionsCount: number;
    timeSettings: TimeSettings;
    quizId: string;
    status: 'preview' | 'in-progress' | 'completed' | 'paused';
    currentQuestionIndex: number;
    score?: number;
    startTime: Date;
    endTime?: Date;
    updatedAt: Date;
}

export const initDB = async (): Promise<IDBPDatabase> => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('userData')) {
                const userStore = db.createObjectStore('userData', { keyPath: 'userId' });
                userStore.createIndex('email', 'email', { unique: true });
            }

            if (!db.objectStoreNames.contains('sessionData')) {
                const sessionStore = db.createObjectStore('sessionData', { keyPath: 'sessionId' });
                sessionStore.createIndex('userId', 'userId');
                sessionStore.createIndex('status', 'status');
            }
        },
    });
};

class AppDB {
    private db: IDBPDatabase | null = null;
    private currentUserId: string | null = null;

    async ensureDB(): Promise<IDBPDatabase> {
        if (!this.db) {
            this.db = await initDB();
        }
        return this.db;
    }

    async setUserLogin(userData: { userId: string; name: string; email: string }): Promise<UserData> {
        const db = await this.ensureDB();
        const user: UserData = {
            userId: userData.userId,
            name: userData.name,
            email: userData.email,
            lastLoginAt: new Date(),
            currentSessionId: null
        };
        await db.put('userData', user);

        this.currentUserId = userData.userId;
        return user;
    }

    async getUser(userId: string): Promise<UserData | undefined> {
        const db = await this.ensureDB();
        return await db.get('userData', userId);
    }
    async getUserId(): Promise<string | null> {
        if (this.currentUserId) {
            return this.currentUserId;
        }
        return null;
    }

    async updateUser(userId: string, updates: Partial<UserData>): Promise<UserData | null> {
        const db = await this.ensureDB();
        const user = await this.getUser(userId);
        if (user) {
            const updatedUser = { ...user, ...updates };
            await db.put('userData', updatedUser);
            return updatedUser;
        }
        return null;
    }

    async createSession(userId: string, categoryData: { category: string; description: string }): Promise<SessionData> {
        const db = await this.ensureDB();
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const session: SessionData = {
            sessionId,
            userId,
            category: categoryData.category,
            categoryDescription: categoryData.description,
            subcategory: '',
            subcategoryDescription: '',
            quizSlugId: '',
            questionsCount: 0,
            timeSettings: {
                totalEnabled: false,
                perQuestionEnabled: false
            },
            quizId: '',
            status: 'preview',
            currentQuestionIndex: 0,
            startTime: new Date(),
            updatedAt: new Date()
        };

        await db.put('sessionData', session);

        await this.updateUser(userId, { currentSessionId: sessionId });

        return session;
    }

    async getCurrentCategoryDetails(sessionId: string) {
        const db = await this.ensureDB();
        const session = await db.get('sessionData', sessionId);
        return {
            category: session.category,
            categoryDescription: session.categoryDescription,
            subcategory: session.subcategory,
            subcategoryDescription: session.subcategoryDescription
        }
    }

    async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<SessionData | null> {
        const db = await this.ensureDB();
        const session = await db.get('sessionData', sessionId);
        if (session) {
            const updatedSession: SessionData = {
                ...session,
                ...updates,
                updatedAt: new Date()
            };
            await db.put('sessionData', updatedSession);
            return updatedSession;
        }
        return null;
    }
    async getQuizPreviewData(sessionId: string) {
        const session = await this.getSession(sessionId);
        if (session) {
            return {
                quizId: session.quizId,
                userId:session.userId
            }
        }

    }

    async getCurrentSession(userId: string): Promise<SessionData | null> {
        const user = await this.getUser(userId);
        if (!user?.currentSessionId) return null;

        const db = await this.ensureDB();
        return await db.get('sessionData', user.currentSessionId);
    }

    async getSession(sessionId: string): Promise<SessionData | undefined> {
        const db = await this.ensureDB();
        return await db.get('sessionData', sessionId);
    }

    async pauseSession(userId: string): Promise<void> {
        const session = await this.getCurrentSession(userId);
        if (session && session.status === 'in-progress') {
            await this.updateSession(session.sessionId, {
                status: 'paused',
                endTime: new Date()
            });
        }
    }

    async logoutUser(userId: string): Promise<void> {
        await this.pauseSession(userId);
        await this.updateUser(userId, { currentSessionId: null });
    }
}

export const appDB = new AppDB();