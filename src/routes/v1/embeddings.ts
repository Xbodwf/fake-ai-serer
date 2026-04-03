import { Router, Request, Response } from 'express';
import type { Model } from '../../types.js';
import { getModel, selectProviderKeyRoundRobin, getProviderById } from '../../storage.js';
import { generateRequestId } from '../../responseBuilder.js';
import { forwardEmbeddingsRequest, isModelForwardingConfigured } from '../../forwarder.js';

const router: Router = Router();

/**
 * POST /v1/embeddings - 向量嵌入
 */
router.post('/', async (req: Request, res: Response) => {
 const modelId = req.body.model;

 if (!modelId) {
 return res.status(400).json({
 error: {
 message: 'model is required',
 type: 'invalid_request_error',
 },
 });
 }

 const model = getModel(modelId);
 if (!model) {
 return res.status(404).json({
 error: {
 message: `Model '${modelId}' not found`,
 type: 'invalid_request_error',
 code: 'model_not_found',
 },
 });
 }

 // 验证模型类型是否为 embedding
 if (model.type !== 'embedding') {
 return res.status(400).json({
 error: {
 message: `Model '${modelId}' (type: ${model.type}) does not support embeddings`,
 type: 'invalid_request_error',
 code: 'model_type_not_supported',
 },
 });
 }

 let runtimeModel: Model = model;

 if (model.forwardingMode === 'provider') {
 if (!model.providerId) {
 return res.status(400).json({
 error: {
 message: `Model '${modelId}' forwardingMode=provider but providerId is missing`,
 type: 'invalid_request_error',
 code: 'provider_not_configured',
 },
 });
 }

 const provider = getProviderById(model.providerId);
 if (!provider || !provider.enabled) {
 return res.status(400).json({
 error: {
 message: `Provider '${model.providerId}' not found or disabled`,
 type: 'invalid_request_error',
 code: 'provider_not_available',
 },
 });
 }

 const selected = await selectProviderKeyRoundRobin(model.providerId);
 if (!selected) {
 return res.status(502).json({
 error: {
 message: `No enabled API key available for provider '${model.providerId}'`,
 type: 'forwarding_error',
 code: 'provider_key_unavailable',
 },
 });
 }

 runtimeModel = {
 ...model,
 api_key: selected.key.key,
 api_base_url: selected.provider.api_base_url,
 api_type: selected.provider.api_type,
 api_url_templates: selected.provider.api_url_templates,
 };
 }

 const hasForwarding = model.forwardingMode === 'none'
 ? false
 : isModelForwardingConfigured(runtimeModel);

 if (hasForwarding) {
 const result = await forwardEmbeddingsRequest(runtimeModel, req.body);
 if (!result.success) {
 let errorResponse: any;
 try {
 errorResponse = JSON.parse(result.error);
 } catch {
 errorResponse = {
 error: {
 message: result.error,
 type: 'forwarding_error',
 code: 'forwarding_failed',
 },
 };
 }
 return res.status(502).json(errorResponse);
 }

 return res.json(result.response);
 }

 res.json({
 object: 'list',
 data: [{
 object: 'embedding',
 embedding: new Array(1536).fill(0),
 index:0,
 }],
 model: modelId,
 usage: {
 prompt_tokens:0,
 total_tokens:0,
 },
 id: generateRequestId(),
 });
});

export default router;
