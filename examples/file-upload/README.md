# 文件上传示例

完整的文件上传系统实现，支持多种文件类型、云存储集成和高级文件管理功能。

## 🎯 功能特性

- ✅ 多文件拖拽上传
- ✅ 图片预览和裁剪
- ✅ 上传进度显示
- ✅ 文件类型和大小验证
- ✅ 云存储集成 (Cloudflare R2, AWS S3)
- ✅ 图片压缩和格式转换
- ✅ 文件管理和组织
- ✅ 安全访问控制

## 🏗️ 技术架构

```
文件上传系统架构
├── 前端组件
│   ├── FileUploader.tsx        # 文件上传器
│   ├── ImageCropper.tsx        # 图片裁剪
│   ├── FilePreview.tsx         # 文件预览
│   ├── ProgressBar.tsx         # 进度条
│   └── FileManager.tsx         # 文件管理器
├── API路由
│   ├── /api/upload             # POST - 文件上传
│   ├── /api/files              # GET - 文件列表
│   ├── /api/files/[id]         # GET,DELETE - 文件详情/删除
│   └── /api/files/signed-url   # POST - 获取签名URL
├── 服务层
│   ├── UploadService           # 上传服务
│   ├── StorageService          # 存储服务
│   ├── ImageService            # 图片处理服务
│   └── ValidationService       # 验证服务
└── 存储层
    ├── Local Storage           # 本地存储
    ├── Cloudflare R2           # R2 存储
    └── AWS S3                  # S3 存储
```

## 📁 文件结构

```
file-upload/
├── components/
│   ├── upload/
│   │   ├── FileUploader.tsx
│   │   ├── DropZone.tsx
│   │   ├── FilePreview.tsx
│   │   ├── ProgressBar.tsx
│   │   └── ImageCropper.tsx
│   ├── file-manager/
│   │   ├── FileManager.tsx
│   │   ├── FileGrid.tsx
│   │   ├── FileList.tsx
│   │   └── FolderTree.tsx
│   └── ui/
│       ├── Modal.tsx
│       └── Tooltip.tsx
├── pages/api/
│   ├── upload.ts
│   ├── files/
│   │   ├── index.ts
│   │   ├── [id].ts
│   │   └── signed-url.ts
│   └── images/
│       ├── compress.ts
│       └── resize.ts
├── lib/
│   ├── services/
│   │   ├── upload.ts
│   │   ├── storage.ts
│   │   ├── image.ts
│   │   └── validation.ts
│   ├── hooks/
│   │   ├── useFileUpload.ts
│   │   ├── useImageCrop.ts
│   │   └── useFileManager.ts
│   ├── utils/
│   │   ├── file.ts
│   │   ├── image.ts
│   │   └── mime.ts
│   └── storage/
│       ├── local.ts
│       ├── r2.ts
│       └── s3.ts
├── prisma/
│   └── schema.prisma
├── types/
│   └── file.ts
└── README.md
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install @aws-sdk/client-s3
npm install multer sharp
npm install react-dropzone react-image-crop
npm install @types/multer
```

### 2. 数据库模型

```prisma
// prisma/schema.prisma
model File {
  id          String     @id @default(cuid())
  filename    String
  originalName String    @map("original_name")
  mimeType    String     @map("mime_type")
  size        Int
  path        String
  url         String
  thumbnail   String?
  width       Int?
  height      Int?
  duration    Float?     // 视频时长(秒)
  storage     StorageType @default(LOCAL)
  bucket      String?
  key         String?    // 云存储的对象键
  checksum    String?    // 文件校验和
  metadata    Json?      // 额外元数据
  
  // 分类和标签
  folderId    String?    @map("folder_id")
  folder      Folder?    @relation(fields: [folderId], references: [id])
  tags        FileTag[]
  
  // 访问控制
  ownerId     String     @map("owner_id")
  owner       User       @relation(fields: [ownerId], references: [id])
  isPublic    Boolean    @default(false) @map("is_public")
  accessLevel AccessLevel @default(PRIVATE)
  
  // 时间戳
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")
  expiresAt   DateTime?  @map("expires_at")
  
  @@index([ownerId])
  @@index([mimeType])
  @@index([storage])
  @@index([folderId])
  @@map("files")
}

model Folder {
  id        String   @id @default(cuid())
  name      String
  path      String   // 完整路径，如 "/photos/2024/vacation"
  parentId  String?  @map("parent_id")
  parent    Folder?  @relation("FolderHierarchy", fields: [parentId], references: [id])
  children  Folder[] @relation("FolderHierarchy")
  
  ownerId   String   @map("owner_id")
  owner     User     @relation(fields: [ownerId], references: [id])
  
  files     File[]
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  @@unique([ownerId, path])
  @@index([ownerId])
  @@index([parentId])
  @@map("folders")
}

model Tag {
  id    String @id @default(cuid())
  name  String @unique
  color String?
  
  files FileTag[]
  
  @@map("tags")
}

model FileTag {
  fileId String
  tagId  String
  
  file File @relation(fields: [fileId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@id([fileId, tagId])
  @@map("file_tags")
}

enum StorageType {
  LOCAL
  S3
  R2
  GCS
}

enum AccessLevel {
  PRIVATE
  PROTECTED
  PUBLIC
}
```

### 3. 文件上传 API

```typescript
// pages/api/upload.ts
import { NextApiRequest, NextApiResponse } from 'next'
import multer from 'multer'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import { withAuth } from '@/lib/middleware/auth'
import { uploadService } from '@/lib/services/upload'
import { storageService } from '@/lib/services/storage'
import { validateFile } from '@/lib/utils/file'

// 配置 multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 10 // 最多10个文件
  },
  fileFilter: (req, file, cb) => {
    const validation = validateFile(file)
    if (validation.valid) {
      cb(null, true)
    } else {
      cb(new Error(validation.error))
    }
  }
})

const uploadMiddleware = upload.array('files', 10)

function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result)
      }
      return resolve(result)
    })
  })
}

async function handleUpload(req: any, res: NextApiResponse) {
  try {
    await runMiddleware(req, res, uploadMiddleware)
    
    const files = req.files as Express.Multer.File[]
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: '未选择文件'
      })
    }

    const { 
      folderId, 
      compress = true, 
      generateThumbnail = true,
      quality = 80 
    } = req.body

    const results = []

    for (const file of files) {
      try {
        let processedBuffer = file.buffer
        let metadata: any = {}

        // 图片处理
        if (file.mimetype.startsWith('image/')) {
          const image = sharp(file.buffer)
          const imageMetadata = await image.metadata()
          
          metadata = {
            width: imageMetadata.width,
            height: imageMetadata.height,
            format: imageMetadata.format
          }

          // 压缩图片
          if (compress) {
            processedBuffer = await image
              .jpeg({ quality: parseInt(quality) })
              .toBuffer()
          }
        }

        // 生成唯一文件名
        const fileId = uuidv4()
        const extension = file.originalname.split('.').pop()
        const filename = `${fileId}.${extension}`

        // 上传到存储服务
        const uploadResult = await storageService.upload({
          buffer: processedBuffer,
          filename,
          mimeType: file.mimetype,
          metadata
        })

        // 生成缩略图
        let thumbnailUrl
        if (generateThumbnail && file.mimetype.startsWith('image/')) {
          const thumbnailBuffer = await sharp(file.buffer)
            .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 70 })
            .toBuffer()

          const thumbnailFilename = `thumb_${filename}`
          const thumbnailResult = await storageService.upload({
            buffer: thumbnailBuffer,
            filename: thumbnailFilename,
            mimeType: 'image/jpeg'
          })
          thumbnailUrl = thumbnailResult.url
        }

        // 保存到数据库
        const savedFile = await uploadService.saveFile({
          filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: processedBuffer.length,
          path: uploadResult.path,
          url: uploadResult.url,
          thumbnail: thumbnailUrl,
          storage: uploadResult.storage,
          bucket: uploadResult.bucket,
          key: uploadResult.key,
          checksum: uploadResult.checksum,
          ownerId: req.user.id,
          folderId: folderId || null,
          metadata: {
            ...metadata,
            compressed: compress,
            originalSize: file.size
          }
        })

        results.push(savedFile)

      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error)
        results.push({
          filename: file.originalname,
          error: error instanceof Error ? error.message : '处理失败'
        })
      }
    }

    res.status(200).json({
      success: true,
      data: results,
      message: `成功上传 ${results.filter(r => !r.error).length} 个文件`
    })

  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '上传失败'
    })
  }
}

export default withAuth(async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`
    })
  }

  return handleUpload(req, res)
})

export const config = {
  api: {
    bodyParser: false, // 禁用默认的 body parser
  },
}
```

### 4. 文件上传组件

```typescript
// components/upload/FileUploader.tsx
'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image, File, Video } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from './ProgressBar'
import { ImageCropper } from './ImageCropper'
import { useFileUpload } from '@/lib/hooks/useFileUpload'

interface FileWithPreview extends File {
  preview?: string
  id: string
}

interface FileUploaderProps {
  onUploadComplete?: (files: any[]) => void
  onError?: (error: string) => void
  maxFiles?: number
  maxSize?: number // bytes
  acceptedTypes?: string[]
  allowCrop?: boolean
  folderId?: string
}

export function FileUploader({
  onUploadComplete,
  onError,
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
  acceptedTypes = ['image/*', 'video/*', 'application/pdf'],
  allowCrop = true,
  folderId
}: FileUploaderProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [cropFile, setCropFile] = useState<FileWithPreview | null>(null)
  
  const { uploadFiles, isUploading, progress } = useFileUpload({
    onSuccess: (uploadedFiles) => {
      onUploadComplete?.(uploadedFiles)
      setFiles([])
    },
    onError: (error) => {
      onError?.(error)
    }
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => {
      const fileWithPreview = Object.assign(file, {
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        id: Math.random().toString(36).substr(2, 9)
      })
      return fileWithPreview
    })

    setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles))
  }, [maxFiles])

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    fileRejections
  } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>),
    maxSize,
    maxFiles
  })

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== fileId)
    })
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    
    if (folderId) {
      formData.append('folderId', folderId)
    }

    await uploadFiles(formData)
  }

  const handleCrop = (file: FileWithPreview) => {
    if (file.type.startsWith('image/')) {
      setCropFile(file)
    }
  }

  const handleCropComplete = (croppedFile: File) => {
    const fileWithPreview = Object.assign(croppedFile, {
      preview: URL.createObjectURL(croppedFile),
      id: cropFile!.id
    })

    setFiles(prev => prev.map(f => 
      f.id === cropFile!.id ? fileWithPreview : f
    ))
    setCropFile(null)
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-8 w-8" />
    if (file.type.startsWith('video/')) return <Video className="h-8 w-8" />
    return <File className="h-8 w-8" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full">
      {/* 拖拽上传区域 */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-blue-600">释放文件开始上传...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              拖拽文件到这里，或点击选择文件
            </p>
            <p className="text-sm text-gray-400">
              支持 {acceptedTypes.join(', ')} 格式，最大 {formatFileSize(maxSize)}
            </p>
          </div>
        )}
      </div>

      {/* 文件拒绝提示 */}
      {fileRejections.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-red-800 font-medium">以下文件被拒绝:</h4>
          <ul className="mt-2 text-sm text-red-600">
            {fileRejections.map(({ file, errors }) => (
              <li key={file.name}>
                {file.name}: {errors.map(e => e.message).join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 文件预览列表 */}
      {files.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-medium mb-4">选中的文件 ({files.length})</h4>
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center p-4 bg-gray-50 rounded-lg"
              >
                {/* 文件预览/图标 */}
                <div className="flex-shrink-0 mr-4">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="h-16 w-16 object-cover rounded"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-gray-200 rounded flex items-center justify-center">
                      {getFileIcon(file)}
                    </div>
                  )}
                </div>

                {/* 文件信息 */}
                <div className="flex-1">
                  <p className="font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                {/* 操作按钮 */}
                <div className="flex space-x-2">
                  {allowCrop && file.type.startsWith('image/') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCrop(file)}
                    >
                      裁剪
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(file.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* 上传进度 */}
          {isUploading && (
            <div className="mt-4">
              <ProgressBar progress={progress} />
            </div>
          )}

          {/* 上传按钮 */}
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleUpload}
              disabled={isUploading || files.length === 0}
              loading={isUploading}
            >
              上传 {files.length} 个文件
            </Button>
          </div>
        </div>
      )}

      {/* 图片裁剪弹窗 */}
      {cropFile && (
        <ImageCropper
          file={cropFile}
          onComplete={handleCropComplete}
          onCancel={() => setCropFile(null)}
        />
      )}
    </div>
  )
}
```

### 5. 图片裁剪组件

```typescript
// components/upload/ImageCropper.tsx
'use client'

import { useState, useRef } from 'react'
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import 'react-image-crop/dist/ReactCrop.css'

interface ImageCropperProps {
  file: File
  onComplete: (croppedFile: File) => void
  onCancel: () => void
  aspectRatio?: number
  minWidth?: number
  minHeight?: number
}

export function ImageCropper({
  file,
  onComplete,
  onCancel,
  aspectRatio,
  minWidth = 100,
  minHeight = 100
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5
  })
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [src, setSrc] = useState<string>()
  const imgRef = useRef<HTMLImageElement>(null)

  const onSelectFile = (file: File) => {
    if (file) {
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setSrc(reader.result?.toString() || '')
      })
      reader.readAsDataURL(file)
    }
  }

  React.useEffect(() => {
    onSelectFile(file)
  }, [file])

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    
    // 设置默认裁剪区域
    const newCrop: Crop = {
      unit: '%',
      width: 90,
      height: aspectRatio ? (90 / aspectRatio) * (width / height) : 90,
      x: 5,
      y: 5
    }
    setCrop(newCrop)
  }

  const getCroppedImg = async (): Promise<File> => {
    if (!completedCrop || !imgRef.current) {
      throw new Error('Crop canvas does not exist')
    }

    const image = imgRef.current
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('No 2d context')
    }

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    canvas.width = completedCrop.width
    canvas.height = completedCrop.height

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    )

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Canvas is empty')
        }
        
        const fileName = file.name.replace(/\.[^/.]+$/, '') + '_cropped.jpg'
        const croppedFile = new File([blob], fileName, {
          type: 'image/jpeg',
          lastModified: Date.now()
        })
        
        resolve(croppedFile)
      }, 'image/jpeg', 0.9)
    })
  }

  const handleCrop = async () => {
    try {
      const croppedFile = await getCroppedImg()
      onComplete(croppedFile)
    } catch (error) {
      console.error('Error cropping image:', error)
    }
  }

  return (
    <Modal isOpen onClose={onCancel} className="max-w-4xl">
      <div className="p-6">
        <h3 className="text-lg font-medium mb-4">裁剪图片</h3>
        
        {src && (
          <div className="mb-6">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
              minWidth={minWidth}
              minHeight={minHeight}
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={src}
                style={{ maxHeight: '70vh' }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={onCancel}
          >
            取消
          </Button>
          <Button
            onClick={handleCrop}
            disabled={!completedCrop}
          >
            确认裁剪
          </Button>
        </div>
      </div>
    </Modal>
  )
}
```

### 6. 文件管理器组件

```typescript
// components/file-manager/FileManager.tsx
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Grid, 
  List, 
  Search, 
  Upload,
  FolderPlus,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FileGrid } from './FileGrid'
import { FileList } from './FileList'
import { FolderTree } from './FolderTree'
import { FileUploader } from '../upload/FileUploader'
import { useFiles } from '@/lib/hooks/useFiles'

type ViewMode = 'grid' | 'list'

export function FileManager() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUploader, setShowUploader] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])

  const { data: files, isLoading, refetch } = useFiles({
    folderId: selectedFolder,
    search: searchQuery
  })

  const handleUploadComplete = () => {
    setShowUploader(false)
    refetch()
  }

  const handleFileSelect = (fileId: string, selected: boolean) => {
    if (selected) {
      setSelectedFiles(prev => [...prev, fileId])
    } else {
      setSelectedFiles(prev => prev.filter(id => id !== fileId))
    }
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected && files) {
      setSelectedFiles(files.map(file => file.id))
    } else {
      setSelectedFiles([])
    }
  }

  return (
    <div className="h-full flex">
      {/* 左侧文件夹树 */}
      <div className="w-64 border-r bg-gray-50 p-4">
        <div className="mb-4">
          <Button
            onClick={() => setShowUploader(true)}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            上传文件
          </Button>
        </div>
        
        <FolderTree
          selectedFolder={selectedFolder}
          onFolderSelect={setSelectedFolder}
        />
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col">
        {/* 工具栏 */}
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜索文件..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                筛选
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800">
                  已选择 {selectedFiles.length} 个文件
                </span>
                <div className="space-x-2">
                  <Button size="sm" variant="outline">
                    下载
                  </Button>
                  <Button size="sm" variant="outline">
                    移动
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600">
                    删除
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 文件列表/网格 */}
        <div className="flex-1 p-4 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : viewMode === 'grid' ? (
            <FileGrid
              files={files || []}
              selectedFiles={selectedFiles}
              onFileSelect={handleFileSelect}
              onSelectAll={handleSelectAll}
            />
          ) : (
            <FileList
              files={files || []}
              selectedFiles={selectedFiles}
              onFileSelect={handleFileSelect}
              onSelectAll={handleSelectAll}
            />
          )}
        </div>
      </div>

      {/* 上传弹窗 */}
      {showUploader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">上传文件</h3>
              <Button
                variant="ghost"
                onClick={() => setShowUploader(false)}
              >
                ×
              </Button>
            </div>
            
            <FileUploader
              onUploadComplete={handleUploadComplete}
              folderId={selectedFolder || undefined}
            />
          </div>
        </div>
      )}
    </div>
  )
}
```

## 🧪 测试示例

```typescript
// tests/upload.test.ts
import { uploadService } from '@/lib/services/upload'
import { storageService } from '@/lib/services/storage'

describe('File Upload Service', () => {
  it('should upload file successfully', async () => {
    const mockFile = {
      buffer: Buffer.from('test content'),
      filename: 'test.txt',
      mimeType: 'text/plain',
      size: 12
    }

    const result = await uploadService.uploadFile(mockFile, 'user-id')
    
    expect(result.filename).toBe('test.txt')
    expect(result.size).toBe(12)
    expect(result.url).toBeDefined()
  })

  it('should validate file type', async () => {
    const invalidFile = {
      mimetype: 'application/exe',
      size: 1000
    }

    const validation = uploadService.validateFile(invalidFile)
    expect(validation.valid).toBe(false)
    expect(validation.error).toContain('不支持的文件类型')
  })

  it('should compress image', async () => {
    const imageBuffer = Buffer.from('fake image data')
    
    const compressed = await uploadService.compressImage(imageBuffer, {
      quality: 80,
      maxWidth: 1920
    })

    expect(compressed.length).toBeLessThanOrEqual(imageBuffer.length)
  })
})
```

## 🔒 安全特性

1. **文件类型验证**: 严格的MIME类型检查
2. **文件大小限制**: 防止过大文件上传
3. **病毒扫描**: 集成文件安全扫描
4. **访问控制**: 基于用户权限的文件访问
5. **签名URL**: 临时访问链接，防止盗链

## 📚 最佳实践

1. **分片上传**: 大文件分片上传，支持断点续传
2. **图片优化**: 自动压缩和格式转换
3. **CDN集成**: 使用CDN加速文件访问
4. **缓存策略**: 合理的缓存设置
5. **监控告警**: 存储空间和带宽监控

这个文件上传示例提供了完整的文件管理功能，支持多种存储后端和高级文件处理特性。