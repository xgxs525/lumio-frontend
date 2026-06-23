"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bot, ChevronLeft, ChevronRight, Loader2, Search, Sparkles, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";

// ── API types ───────────────────────────────────────────────
interface ApiProvider { id: string; display_name: string; logo_url: string | null }
interface ApiDescription { short_description: string | null; best_for: string[] | null; example_tasks: string[] | null }
interface ApiModel {
  id: string; code: string; display_name: string; description: string | null; family_name: string | null;
  provider: ApiProvider | null; context_window: number | null;
  supports_files: boolean; supports_images: boolean; supports_video: boolean;
  quality_score: number; speed_score: number; cost_level: number; is_recommended: boolean;
  input_modalities: string[] | null; description_cn: ApiDescription | null;
}
interface ApiResponse { items: ApiModel[]; total: number }

// ── Display types ────────────────────────────────────────────
type ModelCategory = "全部" | "文本对话" | "长文本分析" | "代码编程" | "文件理解" | "图像生成";
interface ModelInfo {
  id: string; name: string; vendor: string; suited: string; features: string;
  speed: string; quality: string; cost: string; context: string;
  text: boolean; file: boolean; image: boolean; video: boolean;
  scenes: string[]; recommended: boolean; favorite: boolean;
}

const PAGE_SIZE = 9;

// ── Fallback ─────────────────────────────────────────────────
const FALLBACK: ModelInfo[] = [
  { id:"c1",name:"Claude Sonnet 4.6",vendor:"Anthropic",suited:"长文本理解/文件分析/严谨写作",features:"适合处理长文档、复杂问题和结构化分析任务。",speed:"中等",quality:"高",cost:"较高",context:"长上下文",text:true,file:true,image:true,video:false,scenes:["总结 PDF","分析报告","写长文","整理资料"],recommended:true,favorite:false},
  { id:"g1",name:"GPT-5.6",vendor:"OpenAI",suited:"通用对话/写作/代码/多任务处理",features:"综合能力强，适合大多数日常任务。",speed:"中等",quality:"高",cost:"较高",context:"长上下文",text:true,file:true,image:true,video:false,scenes:["写作","翻译","代码解释","方案生成"],recommended:false,favorite:true},
  { id:"d1",name:"DeepSeek-V4-Pro",vendor:"DeepSeek",suited:"推理/编程/中文任务/复杂分析",features:"适合代码、逻辑推理和中文场景。",speed:"中等",quality:"高",cost:"中等",context:"长上下文",text:true,file:true,image:false,video:false,scenes:["代码生成","解释报错","逻辑分析","中文长文"],recommended:false,favorite:false},
  { id:"ge1",name:"Gemini 1.0 Ultra",vendor:"Google",suited:"多模态理解/搜索增强/综合分析",features:"适合图文理解、多模态输入。",speed:"中等",quality:"高",cost:"较高",context:"长上下文",text:true,file:true,image:true,video:false,scenes:["图像理解","多模态分析","搜索增强"],recommended:false,favorite:false},
  { id:"d2",name:"DeepSeek-V4-Flash",vendor:"DeepSeek",suited:"快速回复/日常对话/轻量任务",features:"速度快、成本低。",speed:"快",quality:"中",cost:"低",context:"标准上下文",text:true,file:false,image:false,video:false,scenes:["日常问答","快速翻译"],recommended:false,favorite:false},
];

// ── Helpers ──────────────────────────────────────────────────
function cl(l:number){return l<=1?"低":l<=2?"较低":l<=3?"中等":l<=4?"较高":"高"}
function sl(s:number){return s>=4?"快":s>=2.5?"中等":"慢"}
function ql(q:number){return q>=3.5?"高":q>=2?"中":"低"}
function ctx(w:number|null){if(!w)return"—";if(w>=256000)return"超长上下文";if(w>=64000)return"长上下文";return"标准上下文"}
function mapApi(a:ApiModel,f:boolean):ModelInfo{
  const d=a.description_cn;return{
    id:a.id,name:a.display_name,vendor:a.provider?.display_name??a.family_name??"",
    suited:d?.best_for?.join(" / ")||"通用 AI",
    features:d?.short_description??a.description??"",
    speed:sl(a.speed_score),quality:ql(a.quality_score),cost:cl(a.cost_level),
    context:ctx(a.context_window),
    text:a.input_modalities?.includes("text")??true,file:a.supports_files,image:a.supports_images,video:a.supports_video,
    scenes:d?.example_tasks??[],recommended:a.is_recommended,favorite:f,
  };
}

const categoryParam:Record<ModelCategory,string|null>={"全部":null,"文本对话":"text","长文本分析":"text","代码编程":"code","文件理解":"file_analysis","图像生成":"image_gen"};
const cats:ModelCategory[]=["全部","文本对话","长文本分析","代码编程","文件理解","图像生成"];
const spd:Record<string,string>={"快":"bg-emerald-50 text-emerald-700","中等":"bg-amber-50 text-amber-700","慢":"bg-red-50 text-red-700"};
const qly:Record<string,string>={"高":"bg-blue-50 text-blue-700","中":"bg-slate-50 text-slate-600"};
const cst:Record<string,string>={"低":"bg-emerald-50 text-emerald-700","较低":"bg-emerald-50 text-emerald-700","中等":"bg-amber-50 text-amber-700","较高":"bg-red-50 text-red-700","高":"bg-red-50 text-red-700"};

function RecommendPanel(){
  return (<div className="rounded-2xl border border-slate-200 bg-white p-5">
    <h3 className="text-sm font-bold text-slate-950">不知道选哪个模型？</h3>
    <p className="mt-1 text-xs text-slate-500">输入你的任务，让序光帮你推荐。</p>
    <Input placeholder="例如：帮我写一个短视频脚本" className="mt-4 h-10 border-slate-200 bg-white text-sm placeholder:text-slate-400"/>
    <Button className="mt-3 w-full" size="sm"><Sparkles className="h-4 w-4"/>推荐模型</Button>
    <div className="mt-4 rounded-xl bg-emerald-50/60 p-3">
      <p className="text-[11px] font-semibold text-emerald-600">推荐模型</p>
      <p className="mt-1 text-sm font-bold text-slate-900">GPT-5.6</p>
      <p className="mt-1 text-xs text-slate-500">适合内容创作、表达优化和多轮修改。</p>
      <div className="mt-2 flex gap-1.5">
        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-500">Claude S. 4.6</span>
        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-500">DeepSeek V4</span>
      </div>
    </div>
  </div>);
}

// ── Page ─────────────────────────────────────────────────────
export default function ModelsPage(){
  const [search,setSearch]=useState("");
  const [category,setCategory]=useState<ModelCategory>("全部");
  const [favorites,setFavorites]=useState<Set<string>>(new Set(["gpt56"]));
  const [models,setModels]=useState<ModelInfo[]>([]);
  const [loading,setLoading]=useState(true);
  const [page,setPage]=useState(1);
  const [total,setTotal]=useState(0);
  const tp=Math.max(1,Math.ceil(total/PAGE_SIZE));

  const fetchModels=useCallback(async(p:number,cat:ModelCategory,q:string)=>{
    setLoading(true);
    try{
      const base=process.env.NEXT_PUBLIC_API_BASE_URL??"http://localhost:8000/api/v1";
      const ps=new URLSearchParams({language:"zh-CN",page:String(p),page_size:String(PAGE_SIZE)});
      const ap=categoryParam[cat];if(ap)ps.set("category",ap);
      if(q.trim())ps.set("search",q.trim());
      const r=await fetch(`${base}/models?${ps}`,{headers:{"Content-Type":"application/json"},signal:AbortSignal.timeout(8000)});
      if(!r.ok)throw new Error("api fail");
      const d:ApiResponse=await r.json();
      setModels(d.items.map(m=>mapApi(m,favorites.has(m.id))));
      setTotal(d.total);
    }catch{
      setModels(FALLBACK);setTotal(FALLBACK.length);
    }finally{setLoading(false)}
  },[favorites]);

  useEffect(()=>{fetchModels(page,category,search)},[page,category]); // eslint-disable-line
  useEffect(()=>{const t=setTimeout(()=>{setPage(1);fetchModels(1,category,search)},300);return()=>clearTimeout(t)},[search]); // eslint-disable-line

  const hc=(c:ModelCategory)=>{setCategory(c);setPage(1)};
  const hp=(p:number)=>{if(p>=1&&p<=tp)setPage(p)};
  const tf=(id:string)=>{setFavorites(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n});setModels(p=>p.map(m=>m.id===id?{...m,favorite:!m.favorite}:m))};

  const sorted=[...models].sort((a,b)=>{if(a.recommended&&!b.recommended)return-1;if(!a.recommended&&b.recommended)return 1;if(a.favorite&&!b.favorite)return-1;if(!a.favorite&&b.favorite)return 1;return 0});

  const pn:number[]=[];const st=Math.max(1,page-2);const en=Math.min(tp,page+2);
  for(let i=st;i<=en;i++)pn.push(i);

  return (
    <WorkspaceShell active="模型广场" title="模型广场" subtitle="查看可用模型，根据不同任务选择更合适的 AI。" rightPanel={<RecommendPanel/>}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
          <Input placeholder="搜索模型名称、能力或适用场景" value={search} onChange={e=>setSearch(e.target.value)} className="h-10 border-slate-200 bg-white pl-10 text-sm placeholder:text-slate-400"/>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {cats.map(c=>(<button key={c} onClick={()=>hc(c)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${category===c?"border-blue-200 bg-blue-50 text-blue-700":"border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800"}`}>{c}</button>))}
        </div>
      </div>
      {loading?<div className="mt-20 flex flex-col items-center text-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500"/><p className="mt-4 text-sm text-slate-500">加载模型数据...</p></div>
      :sorted.length===0?<div className="mt-20 flex flex-col items-center text-center"><Bot className="h-12 w-12 text-slate-300"/><h2 className="mt-6 text-xl font-bold text-slate-950">暂无可用模型</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-500">模型接入后会在这里展示。</p><Button className="mt-6" variant="secondary" asChild><Link href="/workspace">返回工作台</Link></Button></div>
      :<>
      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map(m=>(<div key={m.id} className="group relative rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-sm">
          <div className="flex items-center gap-2">
            {m.recommended?<span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">推荐</span>:null}
            {m.favorite?<span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">常用</span>:null}
          </div>
          <h3 className="mt-3 text-lg font-bold text-slate-950">{m.name}</h3>
          <p className="mt-0.5 text-xs text-slate-400">{m.vendor}</p>
          <p className="mt-3 text-xs text-slate-500">{m.features}</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-500"><span className="font-semibold text-slate-700">适合：</span>{m.suited}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${spd[m.speed]||"bg-slate-50 text-slate-600"}`}>{m.speed}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${qly[m.quality]||"bg-slate-50 text-slate-600"}`}>{m.quality}质量</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${cst[m.cost]||"bg-slate-50 text-slate-600"}`}>{m.cost}消耗</span>
            <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500">{m.context}</span>
          </div>
          <div className="mt-3 flex gap-3 text-[10px] text-slate-400">
            <span className={m.text?"text-slate-600":""}>文本{m.text?"✓":"✗"}</span>
            <span className={m.file?"text-slate-600":""}>文件{m.file?"✓":"✗"}</span>
            <span className={m.image?"text-slate-600":""}>图片{m.image?"✓":"✗"}</span>
            <span className={m.video?"text-slate-600":""}>视频{m.video?"✓":"✗"}</span>
          </div>
          {m.scenes.length>0&&<div className="mt-3 flex flex-wrap gap-1">{m.scenes.map(s=><span key={s} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500">{s}</span>)}</div>}
          <div className="mt-4 flex gap-2">
            <Button size="sm" className="flex-1" asChild><Link href="/ai">使用此模型</Link></Button>
            <button onClick={()=>tf(m.id)} className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition ${m.favorite?"border-amber-200 bg-amber-50 text-amber-600":"border-slate-200 text-slate-400 hover:border-slate-300 hover:text-amber-500"}`}><Star className="h-4 w-4" fill={m.favorite?"currentColor":"none"}/></button>
          </div>
        </div>))}
      </div>

      {tp>1&&<div className="mt-8 flex items-center justify-center gap-1">
        <button onClick={()=>hp(page-1)} disabled={page<=1} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 disabled:opacity-30"><ChevronLeft className="h-4 w-4"/></button>
        {st>1&&<><button onClick={()=>hp(1)} className="grid h-9 min-w-[36px] place-items-center rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-500 hover:border-slate-300">1</button>{st>2&&<span className="px-1 text-xs text-slate-400">...</span>}</>}
        {pn.map(p=><button key={p} onClick={()=>hp(p)} className={`grid h-9 min-w-[36px] place-items-center rounded-lg border px-2 text-xs font-medium transition ${p===page?"border-blue-200 bg-blue-50 text-blue-700":"border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}>{p}</button>)}
        {en<tp&&<>{en<tp-1&&<span className="px-1 text-xs text-slate-400">...</span>}<button onClick={()=>hp(tp)} className="grid h-9 min-w-[36px] place-items-center rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-500 hover:border-slate-300">{tp}</button></>}
        <button onClick={()=>hp(page+1)} disabled={page>=tp} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 disabled:opacity-30"><ChevronRight className="h-4 w-4"/></button>
        <span className="ml-3 text-xs text-slate-400">共 {total} 个模型</span>
      </div>}
      </>}
    </WorkspaceShell>
  );
}
