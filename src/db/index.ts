// Database connection
export { connectDB, getDB, disconnectDB } from './connection';
export { initializeIndexes } from './indexes';

// Collections
export * as modelsDB from './models';
export * as usersDB from './users';
export * as apiKeysDB from './apiKeys';
export * as usageRecordsDB from './usageRecords';
export * as invoicesDB from './invoices';
export * as actionsDB from './actions';
export * as notificationsDB from './notifications';
export * as invitationsDB from './invitations';
export * as paymentOrdersDB from './paymentOrders';
export * as providersDB from './providers';
export * as nodesDB from './nodes';

// 备份元数据集合（直接导出集合对象）
import { getDB } from './connection';
export const backupMetadataCollection = getDB().collection('backup_metadata');
