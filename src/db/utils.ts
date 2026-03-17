import { ObjectId, Document } from 'mongodb';

/**
 * 将MongoDB文档转换为应用类型
 * 处理_id到id的转换
 */
export function toEntity<T extends { id?: string }>(doc: Document & { _id: ObjectId }): T {
  const { _id, ...rest } = doc;
  return {
    ...rest,
    id: _id.toString(),
  } as T;
}

/**
 * 将多个MongoDB文档转换为应用类型
 */
export function toEntities<T extends { id?: string }>(docs: (Document & { _id: ObjectId })[]): T[] {
  return docs.map(doc => toEntity<T>(doc));
}
