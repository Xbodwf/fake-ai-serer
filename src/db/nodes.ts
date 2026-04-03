import { ObjectId } from 'mongodb';
import { getDB } from './connection';
import { toEntity, toEntities } from './utils';
import type { Node } from '../types';

const COLLECTION_NAME = 'nodes';

function now() {
 return Date.now();
}

export async function createNode(node: Omit<Node, 'createdAt' | 'updatedAt' | 'status' | 'lastSeenAt'>): Promise<Node> {
 const db = getDB();
 const collection = db.collection(COLLECTION_NAME);

 const doc = {
 ...node,
 status: 'offline' as const,
 lastSeenAt: undefined,
 _id: new ObjectId(),
 createdAt: now(),
 updatedAt: now(),
 };

 await collection.insertOne(doc);
 return toEntity<Node>(doc);
}

export async function getNodeById(id: string): Promise<Node | null> {
 const db = getDB();
 const collection = db.collection(COLLECTION_NAME);
 const doc = await collection.findOne({ id });
 if (!doc) return null;
 return toEntity<Node>(doc as any);
}

export async function getAllNodes(): Promise<Node[]> {
 const db = getDB();
 const collection = db.collection(COLLECTION_NAME);
 const docs = await collection.find({}).toArray();
 return toEntities<Node>(docs as any);
}

export async function updateNodeById(id: string, updates: Partial<Node>): Promise<Node | null> {
 const db = getDB();
 const collection = db.collection(COLLECTION_NAME);

 const updated = await collection.findOneAndUpdate(
 { id },
 { $set: { ...updates, updatedAt: now() } },
 { returnDocument: 'after' }
 );

 if (!updated) return null;
 return toEntity<Node>(updated as any);
}

export async function deleteNodeById(id: string): Promise<boolean> {
 const db = getDB();
 const collection = db.collection(COLLECTION_NAME);
 const result = await collection.deleteOne({ id });
 return result.deletedCount >0;
}

export async function touchNodeHeartbeat(id: string): Promise<Node | null> {
 const db = getDB();
 const collection = db.collection(COLLECTION_NAME);

 const updated = await collection.findOneAndUpdate(
 { id },
 { $set: { status: 'online', lastSeenAt: now(), updatedAt: now() } },
 { returnDocument: 'after' }
 );

 if (!updated) return null;
 return toEntity<Node>(updated as any);
}

export async function markNodeOffline(id: string): Promise<void> {
 const db = getDB();
 const collection = db.collection(COLLECTION_NAME);
 await collection.updateOne({ id }, { $set: { status: 'offline', updatedAt: now() } });
}
