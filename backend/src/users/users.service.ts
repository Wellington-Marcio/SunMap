import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { MongoClient, Db, Collection } from 'mongodb';

@Injectable()
export class UsersService implements OnModuleInit, OnModuleDestroy {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private col: Collection | null = null;

  async onModuleInit() {
    const uri = process.env.MONGO_URI || 'mongodb://root:123456@mongodb:27017/sunmap?authSource=admin';
    try {
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db();
      debugger
      this.col = this.db.collection('users');
      // ensure an index on createdAt for queries/exports
      await this.col.createIndex({ createdAt: 1 });
      // optional: ensure index on location
      await this.col.createIndex({ location: 1 });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('UsersService: failed to connect to MongoDB', e && e.message);
      this.client = null;
      this.db = null;
      this.col = null;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try { await this.client.close(); } catch {}
    }
  }

  private nowIso() {
    return new Date().toISOString();
  }

  async create(data: any): Promise<any> {
    const item = Object.assign({}, data || {});
    if (!item.createdAt) item.createdAt = this.nowIso();
    try {
      if (this.col) {
        const r = await this.col.insertOne(item);
        // return the inserted document with _id -> id
        const doc = await this.col.findOne({ _id: r.insertedId });
        if (doc) {
          // normalize id
          doc.id = String(doc._id);
          delete doc._id;
          return doc;
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('UsersService.create: mongo insert failed', e && e.message);
    }
    // fallback to in-memory store if DB unavailable
    // store in a per-process array for compatibility
    if (!this['_mem']) this['_mem'] = [];
    const mem = this['_mem'];
    item.id = (mem.length + 1).toString();
    mem.push(item);
    return item;
  }

  async findAll(): Promise<any[]> {
    try {
      if (this.col) {
        const docs = await this.col.find({}).sort({ createdAt: -1 }).toArray();
        return docs.map((d: any) => {
          const out = Object.assign({}, d);
          out.id = String(out._id);
          delete out._id;
          return out;
        });
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('UsersService.findAll: mongo find failed', e && e.message);
    }
    if (!this['_mem']) this['_mem'] = [];
    return (this['_mem'] || []).slice();
  }

  async removeAll(): Promise<void> {
    try {
      if (this.col) {
        await this.col.deleteMany({});
        return;
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('UsersService.removeAll: mongo delete failed', e && e.message);
    }
    if (this['_mem']) this['_mem'].length = 0;
  }
}
