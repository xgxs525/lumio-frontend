export type ModelStatus = "available" | "coming" | "maintenance";
export type FilterKey = "all" | "recommended" | "chinese" | "global" | "open" | "text" | "image" | "people" | "commercial";
export type GenerationType = "text" | "image" | "video" | "storyboard";
export type TaskStatus = "generating" | "success" | "failed" | "saved";

export const aspectRatios = ["16:9", "9:16", "1:1", "4:3", "3:4"] as const;
export const durations = ["5 秒", "10 秒", "15 秒", "30 秒", "60 秒", "更长"] as const;
export const resolutions = ["720p", "1080p", "2K", "4K"] as const;
export const videoStyles = ["写实", "电影感", "动漫", "3D", "产品广告", "赛博朋克", "国风", "黑白胶片"] as const;
export const cameraMotions = ["固定镜头", "推近", "拉远", "横移", "环绕", "跟拍", "俯拍", "慢动作"] as const;
export const generationCounts = ["1 条", "2 条", "4 条"] as const;
export const storyboardCounts = ["3 镜", "5 镜", "8 镜", "12 镜"] as const;
export const storyboardPaces = ["舒缓", "标准", "紧凑", "高能"] as const;
export const referenceStrengths = ["低", "中", "高"] as const;

export type AspectRatio = (typeof aspectRatios)[number];
export type Duration = (typeof durations)[number];
export type Resolution = (typeof resolutions)[number];
export type VideoStyle = (typeof videoStyles)[number];
export type CameraMotion = (typeof cameraMotions)[number];
export type GenerationCount = (typeof generationCounts)[number];
export type ReferenceStrength = (typeof referenceStrengths)[number];

export type PendingParameterOptions = {
  aspectRatios?: AspectRatio[];
  durations?: Duration[];
  resolutions?: Resolution[];
  styles?: VideoStyle[];
  cameraMotions?: CameraMotion[];
  referenceStrengths?: ReferenceStrength[];
  generationCounts?: GenerationCount[];
};

export type VideoModel = {
  id: string;
  name: string;
  provider: string;
  version: string;
  displayName: string;
  description: string;
  position: string;
  tags: string[];
  category: string;
  filters: FilterKey[];
  capabilities: GenerationType[];
  supportedGenerationTypes: GenerationType[];
  useCases: string[];
  inputTypes: string[];
  outputTypes: string[];
  supportedAspectRatios: AspectRatio[];
  supportedDurations: Duration[];
  supportedResolutions: Resolution[];
  supportedStyles: VideoStyle[];
  supportedCameraMotions: CameraMotion[];
  supportedReferenceStrengths: ReferenceStrength[];
  maxGenerationCount: number;
  supportsLongVideo: boolean;
  supports4k: boolean;
  supportsAudio: boolean;
  supportsImageToVideo: boolean;
  supportsVideoReference: boolean;
  supportsStoryboard: boolean;
  pendingParameters?: PendingParameterOptions;
  status: ModelStatus;
  isRecommended: boolean;
  sortOrder: number;
  parameterLimits: string[];
  createdAt: string;
  updatedAt: string;
};

export type VideoGenerationTask = {
  id: string;
  userId: string;
  modelId: string;
  modelName: string;
  generationType: GenerationType;
  prompt: string;
  negativePrompt: string;
  promptSummary: string;
  inputImageUrl?: string;
  inputVideoUrl?: string;
  storyboardText?: string;
  aspectRatio: AspectRatio;
  duration: Duration;
  resolution: Resolution;
  style: VideoStyle;
  cameraMotion: CameraMotion;
  referenceStrength?: ReferenceStrength;
  count: GenerationCount;
  status: TaskStatus;
  progress: number;
  resultVideoUrl?: string;
  thumbnailUrl?: string;
  thumbnailTone: "blue" | "cyan" | "violet" | "emerald" | "rose";
  errorMessage?: string;
  isSaved: boolean;
  createdAt: string;
  createdAtLabel: string;
  updatedAt: string;
};

export const videoFilters: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "全部" },
  { key: "recommended", label: "推荐模型" },
  { key: "chinese", label: "中文视频模型" },
  { key: "global", label: "海外视频模型" },
  { key: "open", label: "开源模型" },
  { key: "text", label: "文生视频" },
  { key: "image", label: "图生视频" },
  { key: "people", label: "人物视频" },
  { key: "commercial", label: "商业视频" },
];

export const generationModeCopy: Record<GenerationType, { label: string; desc: string }> = {
  text: {
    label: "文本生成视频",
    desc: "用提示词描述画面、动作和镜头。",
  },
  image: {
    label: "图片生成视频",
    desc: "上传参考图，让图片动起来。",
  },
  video: {
    label: "视频参考生成",
    desc: "上传参考视频，基于已有素材生成新视频。",
  },
  storyboard: {
    label: "分镜脚本生成",
    desc: "输入故事或脚本，自动拆分成分镜画面。",
  },
};

export const videoModels: VideoModel[] = [
  {
    id: "runway-gen-45",
    name: "Runway Gen-4.5",
    provider: "Runway",
    version: "Gen-4.5",
    displayName: "Runway Gen-4.5",
    description: "适合生成质感更强、镜头控制更好的视频内容。",
    position: "高质量视频生成模型",
    tags: ["高质量", "强可控", "商业视频", "镜头感"],
    category: "commercial",
    filters: ["recommended", "global", "text", "image", "commercial"],
    capabilities: ["text", "image", "video"],
    supportedGenerationTypes: ["text", "image", "video"],
    useCases: ["广告片", "产品展示", "品牌短片", "创意视频"],
    inputTypes: ["文本", "图片", "视频"],
    outputTypes: ["视频"],
    supportedAspectRatios: ["16:9", "9:16", "1:1", "4:3"],
    supportedDurations: ["5 秒", "10 秒", "15 秒", "30 秒"],
    supportedResolutions: ["720p", "1080p", "2K", "4K"],
    supportedStyles: ["写实", "电影感", "3D", "产品广告", "黑白胶片"],
    supportedCameraMotions: ["固定镜头", "推近", "拉远", "横移", "环绕", "跟拍", "慢动作"],
    supportedReferenceStrengths: ["低", "中", "高"],
    maxGenerationCount: 2,
    supportsLongVideo: false,
    supports4k: true,
    supportsAudio: false,
    supportsImageToVideo: true,
    supportsVideoReference: true,
    supportsStoryboard: false,
    pendingParameters: { durations: ["60 秒", "更长"], generationCounts: ["4 条"] },
    status: "available",
    isRecommended: true,
    sortOrder: 1,
    parameterLimits: ["适合高质量商业短片和产品展示", "4K 输出会消耗更高额度"],
    createdAt: "2026-06-01T08:00:00Z",
    updatedAt: "2026-06-24T08:00:00Z",
  },
  {
    id: "google-veo-31",
    name: "Google Veo",
    provider: "Google",
    version: "3.1",
    displayName: "Google Veo 3.1",
    description: "适合生成真实感较强、画面稳定且带原生音频感的视频内容。",
    position: "真实感视频生成模型",
    tags: ["真实感", "原生音频", "长镜头", "电影感"],
    category: "global",
    filters: ["recommended", "global", "text", "image", "commercial"],
    capabilities: ["text", "image"],
    supportedGenerationTypes: ["text", "image"],
    useCases: ["电影感画面", "叙事视频", "写实风格视频"],
    inputTypes: ["文本", "图片"],
    outputTypes: ["视频", "音频"],
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
    supportedDurations: ["5 秒", "10 秒", "15 秒", "30 秒", "60 秒"],
    supportedResolutions: ["720p", "1080p", "2K"],
    supportedStyles: ["写实", "电影感", "产品广告"],
    supportedCameraMotions: ["固定镜头", "推近", "拉远", "横移", "跟拍"],
    supportedReferenceStrengths: ["低", "中"],
    maxGenerationCount: 2,
    supportsLongVideo: true,
    supports4k: false,
    supportsAudio: true,
    supportsImageToVideo: true,
    supportsVideoReference: false,
    supportsStoryboard: false,
    pendingParameters: { resolutions: ["4K"], durations: ["更长"], referenceStrengths: ["高"] },
    status: "available",
    isRecommended: true,
    sortOrder: 2,
    parameterLimits: ["适合写实叙事和长镜头生成", "原生音频能力适合预览型创意验证"],
    createdAt: "2026-06-01T08:00:00Z",
    updatedAt: "2026-06-22T08:00:00Z",
  },
  {
    id: "openai-sora-2",
    name: "OpenAI Sora",
    provider: "OpenAI",
    version: "2",
    displayName: "OpenAI Sora 2",
    description: "适合根据复杂描述生成连贯的视频画面和创意场景。",
    position: "综合视频生成模型",
    tags: ["场景理解", "动作连贯", "复杂提示词", "创意视频"],
    category: "global",
    filters: ["recommended", "global", "text", "image"],
    capabilities: ["text", "image", "video"],
    supportedGenerationTypes: ["text", "image", "video"],
    useCases: ["创意短片", "概念视频", "复杂场景生成"],
    inputTypes: ["文本", "图片", "视频"],
    outputTypes: ["视频"],
    supportedAspectRatios: ["16:9", "9:16", "1:1", "3:4"],
    supportedDurations: ["5 秒", "10 秒", "15 秒", "30 秒"],
    supportedResolutions: ["720p", "1080p", "2K"],
    supportedStyles: ["写实", "电影感", "动漫", "3D", "赛博朋克", "国风"],
    supportedCameraMotions: ["固定镜头", "推近", "拉远", "横移", "环绕", "跟拍", "俯拍", "慢动作"],
    supportedReferenceStrengths: ["低", "中", "高"],
    maxGenerationCount: 1,
    supportsLongVideo: false,
    supports4k: false,
    supportsAudio: false,
    supportsImageToVideo: true,
    supportsVideoReference: true,
    supportsStoryboard: false,
    pendingParameters: { durations: ["60 秒", "更长"], resolutions: ["4K"], generationCounts: ["2 条", "4 条"] },
    status: "available",
    isRecommended: true,
    sortOrder: 3,
    parameterLimits: ["适合复杂创意镜头和多主体场景", "复杂提示词建议单条生成以保持稳定"],
    createdAt: "2026-06-01T08:00:00Z",
    updatedAt: "2026-06-18T08:00:00Z",
  },
  {
    id: "seedance-20",
    name: "Seedance",
    provider: "字节跳动",
    version: "2.0",
    displayName: "Seedance 2.0",
    description: "适合中文内容创作者进行短视频生成和分镜素材制作。",
    position: "中文生态视频生成模型",
    tags: ["中文理解", "短视频", "人物场景", "内容创作"],
    category: "chinese",
    filters: ["recommended", "chinese", "text", "people"],
    capabilities: ["text", "image", "storyboard"],
    supportedGenerationTypes: ["text", "image", "storyboard"],
    useCases: ["短视频内容", "口播辅助", "剧情分镜", "中文创作"],
    inputTypes: ["文本", "图片", "脚本"],
    outputTypes: ["视频", "分镜"],
    supportedAspectRatios: ["16:9", "9:16", "1:1", "3:4"],
    supportedDurations: ["5 秒", "10 秒", "15 秒", "30 秒", "60 秒"],
    supportedResolutions: ["720p", "1080p"],
    supportedStyles: ["写实", "电影感", "动漫", "产品广告", "国风"],
    supportedCameraMotions: ["固定镜头", "推近", "横移", "跟拍", "俯拍"],
    supportedReferenceStrengths: ["低", "中"],
    maxGenerationCount: 4,
    supportsLongVideo: true,
    supports4k: false,
    supportsAudio: false,
    supportsImageToVideo: true,
    supportsVideoReference: false,
    supportsStoryboard: true,
    pendingParameters: { resolutions: ["2K", "4K"], cameraMotions: ["环绕", "慢动作"], referenceStrengths: ["高"] },
    status: "available",
    isRecommended: true,
    sortOrder: 4,
    parameterLimits: ["中文提示词和分镜脚本生成更稳定", "适合口播、剧情和社媒内容"],
    createdAt: "2026-06-01T08:00:00Z",
    updatedAt: "2026-06-21T08:00:00Z",
  },
  {
    id: "kling-30",
    name: "Kling",
    provider: "快手可灵",
    version: "3.0",
    displayName: "Kling 3.0",
    description: "适合生成动作自然、人物表现力较强的视频内容。",
    position: "中文视频生成模型",
    tags: ["人物动作", "镜头运动", "图生视频", "短视频"],
    category: "chinese",
    filters: ["recommended", "chinese", "image", "people"],
    capabilities: ["text", "image", "video"],
    supportedGenerationTypes: ["text", "image", "video"],
    useCases: ["人物视频", "图生视频", "剧情短片", "社媒内容"],
    inputTypes: ["文本", "图片", "视频"],
    outputTypes: ["视频"],
    supportedAspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4"],
    supportedDurations: ["5 秒", "10 秒", "15 秒", "30 秒"],
    supportedResolutions: ["720p", "1080p", "2K"],
    supportedStyles: ["写实", "电影感", "动漫", "国风"],
    supportedCameraMotions: ["固定镜头", "推近", "拉远", "横移", "环绕", "跟拍", "俯拍"],
    supportedReferenceStrengths: ["低", "中", "高"],
    maxGenerationCount: 2,
    supportsLongVideo: false,
    supports4k: false,
    supportsAudio: false,
    supportsImageToVideo: true,
    supportsVideoReference: true,
    supportsStoryboard: false,
    pendingParameters: { durations: ["60 秒", "更长"], resolutions: ["4K"], cameraMotions: ["慢动作"], generationCounts: ["4 条"] },
    status: "available",
    isRecommended: true,
    sortOrder: 5,
    parameterLimits: ["适合人物动作和图生视频", "参考素材质量会明显影响人物一致性"],
    createdAt: "2026-06-01T08:00:00Z",
    updatedAt: "2026-06-20T08:00:00Z",
  },
  {
    id: "luma-ray-32",
    name: "Luma Ray",
    provider: "Luma AI",
    version: "3.2",
    displayName: "Luma Ray 3.2",
    description: "适合生成画面质感强、有空间感的视频内容。",
    position: "视觉表现型视频生成模型",
    tags: ["画面质感", "动态镜头", "空间感", "创意视觉"],
    category: "global",
    filters: ["global", "text", "image", "commercial"],
    capabilities: ["text", "image"],
    supportedGenerationTypes: ["text", "image"],
    useCases: ["视觉短片", "动态场景", "艺术感视频"],
    inputTypes: ["文本", "图片"],
    outputTypes: ["视频"],
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
    supportedDurations: ["5 秒", "10 秒", "15 秒"],
    supportedResolutions: ["720p", "1080p", "2K"],
    supportedStyles: ["写实", "电影感", "3D", "赛博朋克", "黑白胶片"],
    supportedCameraMotions: ["固定镜头", "推近", "拉远", "横移", "环绕"],
    supportedReferenceStrengths: ["低", "中"],
    maxGenerationCount: 2,
    supportsLongVideo: false,
    supports4k: false,
    supportsAudio: false,
    supportsImageToVideo: true,
    supportsVideoReference: false,
    supportsStoryboard: false,
    pendingParameters: { durations: ["30 秒", "60 秒", "更长"], resolutions: ["4K"], referenceStrengths: ["高"] },
    status: "available",
    isRecommended: false,
    sortOrder: 6,
    parameterLimits: ["适合空间感和艺术化动态场景", "高分辨率输出建议选择 2K"],
    createdAt: "2026-06-01T08:00:00Z",
    updatedAt: "2026-06-14T08:00:00Z",
  },
  {
    id: "hailuo-23",
    name: "MiniMax Hailuo",
    provider: "MiniMax",
    version: "2.3",
    displayName: "MiniMax Hailuo 2.3",
    description: "适合中文用户快速生成轻剧情和社交媒体短视频素材。",
    position: "中文视频生成模型",
    tags: ["中文提示词", "短视频", "人物", "剧情"],
    category: "chinese",
    filters: ["chinese", "text", "people"],
    capabilities: ["text", "image", "storyboard"],
    supportedGenerationTypes: ["text", "image", "storyboard"],
    useCases: ["中文短视频", "社交媒体内容", "轻剧情视频"],
    inputTypes: ["文本", "图片", "脚本"],
    outputTypes: ["视频", "分镜"],
    supportedAspectRatios: ["9:16", "1:1", "3:4"],
    supportedDurations: ["5 秒", "10 秒", "15 秒"],
    supportedResolutions: ["720p", "1080p"],
    supportedStyles: ["写实", "电影感", "动漫", "国风"],
    supportedCameraMotions: ["固定镜头", "推近", "横移", "跟拍", "慢动作"],
    supportedReferenceStrengths: ["低", "中"],
    maxGenerationCount: 4,
    supportsLongVideo: false,
    supports4k: false,
    supportsAudio: false,
    supportsImageToVideo: true,
    supportsVideoReference: false,
    supportsStoryboard: true,
    pendingParameters: { durations: ["30 秒", "60 秒", "更长"], resolutions: ["2K", "4K"], referenceStrengths: ["高"] },
    status: "available",
    isRecommended: false,
    sortOrder: 7,
    parameterLimits: ["优先支持竖屏短视频", "适合中文轻剧情和社交内容"],
    createdAt: "2026-06-01T08:00:00Z",
    updatedAt: "2026-06-16T08:00:00Z",
  },
  {
    id: "vidu-q3",
    name: "Vidu",
    provider: "Vidu",
    version: "Q3",
    displayName: "Vidu Q3",
    description: "适合需要人物稳定性和图生视频能力的场景。",
    position: "视频生成模型",
    tags: ["人物一致性", "图生视频", "动作表现", "中文生态"],
    category: "chinese",
    filters: ["chinese", "image", "people"],
    capabilities: ["image", "video"],
    supportedGenerationTypes: ["image", "video"],
    useCases: ["人物视频", "参考图生成", "短片创作"],
    inputTypes: ["图片", "文本", "视频"],
    outputTypes: ["视频"],
    supportedAspectRatios: ["16:9", "9:16", "1:1", "3:4"],
    supportedDurations: ["5 秒", "10 秒"],
    supportedResolutions: ["720p", "1080p"],
    supportedStyles: ["写实", "动漫", "3D", "国风"],
    supportedCameraMotions: ["固定镜头", "推近", "拉远", "横移", "跟拍"],
    supportedReferenceStrengths: ["中", "高"],
    maxGenerationCount: 2,
    supportsLongVideo: false,
    supports4k: false,
    supportsAudio: false,
    supportsImageToVideo: true,
    supportsVideoReference: true,
    supportsStoryboard: false,
    pendingParameters: { durations: ["15 秒", "30 秒", "60 秒", "更长"], resolutions: ["2K", "4K"], cameraMotions: ["环绕", "俯拍", "慢动作"], generationCounts: ["4 条"] },
    status: "available",
    isRecommended: false,
    sortOrder: 8,
    parameterLimits: ["更适合参考图或参考视频", "人物一致性任务建议上传清晰素材"],
    createdAt: "2026-06-01T08:00:00Z",
    updatedAt: "2026-06-12T08:00:00Z",
  },
  {
    id: "wan-22-21",
    name: "Wan",
    provider: "阿里通义万相",
    version: "2.2 / 2.1",
    displayName: "Wan 2.2 / 2.1",
    description: "适合开源生态和可扩展视频生成场景。",
    position: "开源 / 中文生态视频模型",
    tags: ["开源生态", "中文能力", "文生视频", "图生视频"],
    category: "open",
    filters: ["chinese", "open", "text", "image"],
    capabilities: ["text", "image"],
    supportedGenerationTypes: ["text", "image"],
    useCases: ["研究部署", "中文视频生成", "模型实验"],
    inputTypes: ["文本", "图片"],
    outputTypes: ["视频"],
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
    supportedDurations: ["5 秒", "10 秒", "15 秒"],
    supportedResolutions: ["720p", "1080p"],
    supportedStyles: ["写实", "动漫", "国风"],
    supportedCameraMotions: ["固定镜头", "推近", "横移"],
    supportedReferenceStrengths: ["低"],
    maxGenerationCount: 1,
    supportsLongVideo: false,
    supports4k: false,
    supportsAudio: false,
    supportsImageToVideo: true,
    supportsVideoReference: false,
    supportsStoryboard: false,
    pendingParameters: { durations: ["30 秒", "60 秒", "更长"], resolutions: ["2K", "4K"], referenceStrengths: ["中", "高"], generationCounts: ["2 条", "4 条"] },
    status: "coming",
    isRecommended: false,
    sortOrder: 9,
    parameterLimits: ["开源生态接入中", "上线后优先支持文生视频和图生视频"],
    createdAt: "2026-06-01T08:00:00Z",
    updatedAt: "2026-06-10T08:00:00Z",
  },
  {
    id: "hunyuan-video-15",
    name: "HunyuanVideo",
    provider: "腾讯混元",
    version: "1.5",
    displayName: "HunyuanVideo 1.5",
    description: "适合中文语境下的视频生成和技术扩展。",
    position: "开源 / 中文视频生成模型",
    tags: ["开源", "中文语义", "视频生成", "研究部署"],
    category: "open",
    filters: ["chinese", "open", "text"],
    capabilities: ["text"],
    supportedGenerationTypes: ["text"],
    useCases: ["中文视频生成", "模型研究", "自部署探索"],
    inputTypes: ["文本"],
    outputTypes: ["视频"],
    supportedAspectRatios: ["16:9", "9:16"],
    supportedDurations: ["5 秒", "10 秒", "15 秒"],
    supportedResolutions: ["720p", "1080p"],
    supportedStyles: ["写实", "动漫", "国风"],
    supportedCameraMotions: ["固定镜头", "推近", "横移"],
    supportedReferenceStrengths: ["低"],
    maxGenerationCount: 1,
    supportsLongVideo: false,
    supports4k: false,
    supportsAudio: false,
    supportsImageToVideo: false,
    supportsVideoReference: false,
    supportsStoryboard: false,
    pendingParameters: { durations: ["30 秒", "60 秒", "更长"], resolutions: ["2K", "4K"], referenceStrengths: ["中", "高"], generationCounts: ["2 条", "4 条"] },
    status: "coming",
    isRecommended: false,
    sortOrder: 10,
    parameterLimits: ["开源生态接入中", "上线后优先支持中文文生视频"],
    createdAt: "2026-06-01T08:00:00Z",
    updatedAt: "2026-06-10T08:00:00Z",
  },
];

export const videoTasks: VideoGenerationTask[] = [
  {
    id: "task-1001",
    userId: "local-user",
    modelId: "runway-gen-45",
    modelName: "Runway Gen-4.5",
    generationType: "text",
    prompt: "电影感广告片，产品从清晨光线里被缓慢推近，金属材质，高级质感，浅景深，柔和自然光。",
    negativePrompt: "低清晰度、闪烁、文字水印、手部畸形、过曝",
    promptSummary: "电影感广告片，产品从清晨光线里被缓慢推近",
    aspectRatio: "16:9",
    duration: "10 秒",
    resolution: "1080p",
    style: "电影感",
    cameraMotion: "推近",
    referenceStrength: "中",
    count: "1 条",
    status: "success",
    progress: 100,
    resultVideoUrl: "#",
    thumbnailTone: "blue",
    isSaved: false,
    createdAt: "2026-06-24T15:24:00+08:00",
    createdAtLabel: "今天 15:24",
    updatedAt: "2026-06-24T15:29:00+08:00",
  },
  {
    id: "task-1002",
    userId: "local-user",
    modelId: "kling-30",
    modelName: "Kling 3.0",
    generationType: "image",
    prompt: "中文剧情短片，人物在雨夜街头回头，慢动作，冷蓝色调，街灯反射在地面，情绪克制。",
    negativePrompt: "面部变形、画面抖动、低清晰度",
    promptSummary: "人物在雨夜街头回头，冷蓝色调慢动作",
    inputImageUrl: "#",
    aspectRatio: "9:16",
    duration: "10 秒",
    resolution: "1080p",
    style: "电影感",
    cameraMotion: "跟拍",
    referenceStrength: "高",
    count: "2 条",
    status: "saved",
    progress: 100,
    resultVideoUrl: "#",
    thumbnailTone: "cyan",
    isSaved: true,
    createdAt: "2026-06-24T11:08:00+08:00",
    createdAtLabel: "今天 11:08",
    updatedAt: "2026-06-24T11:15:00+08:00",
  },
  {
    id: "task-1003",
    userId: "local-user",
    modelId: "seedance-20",
    modelName: "Seedance 2.0",
    generationType: "storyboard",
    prompt: "一个科技办公场景的中文口播短视频背景，轻微运镜，画面干净明亮，适合知识分享账号。",
    negativePrompt: "杂乱背景、暗光、品牌水印",
    promptSummary: "中文口播短视频背景，科技办公场景",
    storyboardText: "镜头 1：明亮办公区远景；镜头 2：人物口播中景；镜头 3：屏幕信息流细节。",
    aspectRatio: "9:16",
    duration: "15 秒",
    resolution: "1080p",
    style: "写实",
    cameraMotion: "横移",
    referenceStrength: "中",
    count: "1 条",
    status: "failed",
    progress: 42,
    thumbnailTone: "rose",
    errorMessage: "模型繁忙，建议稍后重试或切换模型。",
    isSaved: false,
    createdAt: "2026-06-23T20:42:00+08:00",
    createdAtLabel: "昨天 20:42",
    updatedAt: "2026-06-23T20:45:00+08:00",
  },
  {
    id: "task-1004",
    userId: "local-user",
    modelId: "openai-sora-2",
    modelName: "OpenAI Sora 2",
    generationType: "text",
    prompt: "一个玻璃城市中漂浮的数据光带，镜头从低角度缓慢环绕，整体有未来科技感但保持真实材质。",
    negativePrompt: "过度卡通、文字、噪点",
    promptSummary: "玻璃城市与数据光带，低角度环绕镜头",
    aspectRatio: "16:9",
    duration: "15 秒",
    resolution: "2K",
    style: "赛博朋克",
    cameraMotion: "环绕",
    referenceStrength: "中",
    count: "1 条",
    status: "generating",
    progress: 68,
    thumbnailTone: "violet",
    isSaved: false,
    createdAt: "2026-06-24T16:12:00+08:00",
    createdAtLabel: "今天 16:12",
    updatedAt: "2026-06-24T16:14:00+08:00",
  },
  {
    id: "task-1005",
    userId: "local-user",
    modelId: "luma-ray-32",
    modelName: "Luma Ray 3.2",
    generationType: "video",
    prompt: "基于参考视频生成一段动态空间漫游，保留建筑材质，增加晨光和轻微镜头推进。",
    negativePrompt: "模糊、跳帧、变形",
    promptSummary: "参考视频生成建筑空间漫游，晨光推近",
    inputVideoUrl: "#",
    aspectRatio: "16:9",
    duration: "5 秒",
    resolution: "2K",
    style: "写实",
    cameraMotion: "推近",
    referenceStrength: "中",
    count: "1 条",
    status: "success",
    progress: 100,
    resultVideoUrl: "#",
    thumbnailTone: "emerald",
    isSaved: false,
    createdAt: "2026-06-22T18:30:00+08:00",
    createdAtLabel: "6 月 22 日 18:30",
    updatedAt: "2026-06-22T18:36:00+08:00",
  },
];

export const tableSuggestions = {
  video_models: [
    "id",
    "name",
    "provider",
    "version",
    "display_name",
    "description",
    "tags",
    "category",
    "input_types",
    "output_types",
    "supported_aspect_ratios",
    "supported_durations",
    "supported_resolutions",
    "supported_styles",
    "supported_camera_motions",
    "supported_generation_types",
    "supported_reference_strengths",
    "max_generation_count",
    "supports_long_video",
    "supports_4k",
    "supports_audio",
    "supports_image_to_video",
    "supports_video_reference",
    "supports_storyboard",
    "status",
    "is_recommended",
    "sort_order",
    "created_at",
    "updated_at",
  ],
  video_generation_tasks: [
    "id",
    "user_id",
    "model_id",
    "generation_type",
    "prompt",
    "negative_prompt",
    "input_image_url",
    "input_video_url",
    "storyboard_text",
    "aspect_ratio",
    "duration",
    "resolution",
    "style",
    "camera_motion",
    "reference_strength",
    "count",
    "status",
    "progress",
    "result_video_url",
    "thumbnail_url",
    "error_message",
    "created_at",
    "updated_at",
  ],
  video_generation_history: [
    "id",
    "user_id",
    "task_id",
    "model_name",
    "prompt_summary",
    "thumbnail_url",
    "video_url",
    "duration",
    "resolution",
    "aspect_ratio",
    "status",
    "is_saved",
    "created_at",
  ],
};

export function getVideoModel(modelId: string | undefined) {
  return videoModels.find((model) => model.id === modelId) || videoModels[0];
}

export function getVideoTask(taskId: string | undefined) {
  return videoTasks.find((task) => task.id === taskId);
}

export function getTaskModel(task: VideoGenerationTask) {
  return getVideoModel(task.modelId);
}

export function supportsGenerationType(model: VideoModel, type: GenerationType) {
  return model.supportedGenerationTypes.includes(type);
}

export function getRecommendedVideoModels() {
  return videoModels.filter((model) => model.isRecommended).slice(0, 5);
}

export function recommendModels(prompt: string) {
  const text = prompt.toLowerCase();
  if (/口播|中文|短视频|剧情|社媒|抖音|小红书/.test(text)) {
    return ["seedance-20", "kling-30", "hailuo-23"];
  }
  if (/电影|广告|商业|品牌|产品|质感|大片/.test(text)) {
    return ["runway-gen-45", "google-veo-31", "luma-ray-32"];
  }
  if (/开源|部署|研究|实验|自部署/.test(text)) {
    return ["wan-22-21", "hunyuan-video-15"];
  }
  return ["runway-gen-45", "google-veo-31", "openai-sora-2"];
}
