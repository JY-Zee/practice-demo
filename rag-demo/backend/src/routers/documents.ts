/**
 * 文档管理路由
 *
 * - POST /api/documents/upload  文件上传
 * - GET  /api/documents         分页查询文档列表
 * - GET  /api/documents/:id     查询文档详情
 */

import Router from '@koa/router';
import multer from '@koa/multer';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';
import { validate } from '../middlewares/validate';
import { ListDocumentsQuerySchema } from '../schemas/document';
import * as documentService from '../services/documentService';

const router = new Router({ prefix: '/api/documents' });

// 确保上传目录存在
const uploadDir = path.isAbsolute(env.UPLOAD_DIR)
  ? env.UPLOAD_DIR
  : path.resolve(process.cwd(), env.UPLOAD_DIR);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.txt', '.md', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件类型: ${ext}，仅支持 ${allowed.join(', ')}`) as any, false);
    }
  },
});

/**
 * @openapi
 * /api/documents/upload:
 *   post:
 *     tags: [文档管理]
 *     summary: 上传文档
 *     description: 上传 txt/md/pdf 文件，自动创建摄取任务
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 支持 txt、md、pdf
 *     responses:
 *       201:
 *         description: 上传成功
 *       400:
 *         description: 缺少文件或文件类型不支持
 */
router.post('/upload', upload.single('file'), async (ctx) => {
  const file = ctx.file;
  if (!file) {
    ctx.status = 400;
    ctx.body = { error: { status: 400, message: '请上传文件（字段名: file）' } };
    return;
  }

  const result = await documentService.uploadDocument({
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    storagePath: file.path,
  });

  ctx.status = 201;
  ctx.body = result;
});

/**
 * @openapi
 * /api/documents:
 *   get:
 *     tags: [文档管理]
 *     summary: 分页查询文档列表
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed]
 *     responses:
 *       200:
 *         description: 文档列表
 */
router.get('/', validate(ListDocumentsQuerySchema, 'query'), async (ctx) => {
  const query = ctx.state.validated;
  const result = await documentService.listDocuments(query);
  ctx.body = result;
});

/**
 * @openapi
 * /api/documents/{id}:
 *   get:
 *     tags: [文档管理]
 *     summary: 查询文档详情
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 文档详情
 *       404:
 *         description: 文档不存在
 */
router.get('/:id', async (ctx) => {
  const doc = await documentService.getDocumentById(ctx.params.id);
  if (!doc) {
    ctx.status = 404;
    ctx.body = { error: { status: 404, message: '文档不存在' } };
    return;
  }
  ctx.body = doc;
});

export { router as documentsRouter };
