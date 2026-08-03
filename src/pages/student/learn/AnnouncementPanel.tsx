import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, ChevronDown, Loader2, Pin } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { formatRelativeTime } from '@/lib/dateTime';
import { announcementKeys, useAnnouncementUnread, useCourseAnnouncements, useReadAnnouncement } from '@/hooks/useCourseAnnouncements';
import { DISCUSSION_REALTIME_EVENT, isDiscussionConnected, retainDiscussionSocket, subscribeDiscussionLesson, type DiscussionRealtimeDetail } from '@/services/discussionSocket';

export function AnnouncementPanel({courseId,lessonId}:{courseId:string;lessonId:string}){
  const [params]=useSearchParams(); const focusId=params.get('announcementId')||''; const query=useCourseAnnouncements(courseId,focusId); const unread=useAnnouncementUnread(courseId); const read=useReadAnnouncement(courseId); const qc=useQueryClient();
  const [expanded,setExpanded]=useState(focusId); const [connected,setConnected]=useState(isDiscussionConnected()); const scrolled=useRef('');
  const items=useMemo(()=>Array.from(new Map((query.data?.pages.flatMap(p=>p.items)||[]).map(x=>[x._id,x])).values()),[query.data]);
  useEffect(()=>{const release=retainDiscussionSocket();const unsub=subscribeDiscussionLesson(courseId,lessonId);const handler=(event:Event)=>{const d=(event as CustomEvent<DiscussionRealtimeDetail>).detail;if(d.type==='status')setConnected(d.connected);if(d.type==='reconcile'||d.type==='announcement'){void qc.invalidateQueries({queryKey:announcementKeys.list(courseId)});void qc.invalidateQueries({queryKey:announcementKeys.unread(courseId)})}};window.addEventListener(DISCUSSION_REALTIME_EVENT,handler);return()=>{window.removeEventListener(DISCUSSION_REALTIME_EVENT,handler);unsub();release()}},[courseId,lessonId,qc]);
  useEffect(()=>{if(connected||document.hidden)return;const timer=setInterval(()=>{void qc.invalidateQueries({queryKey:announcementKeys.list(courseId)});void qc.invalidateQueries({queryKey:announcementKeys.unread(courseId)})},15000);return()=>clearInterval(timer)},[connected,courseId,qc]);
  useEffect(()=>{if(!focusId||scrolled.current===focusId)return;const item=items.find(x=>x._id===focusId);if(!item)return;setExpanded(focusId);read.mutate(focusId);requestAnimationFrame(()=>document.getElementById('announcement-'+focusId)?.scrollIntoView({behavior:'smooth',block:'center'}));scrolled.current=focusId},[focusId,items,read]);
  const toggle=(id:string)=>{const opening=expanded!==id;setExpanded(opening?id:'');if(opening)read.mutate(id)};
  if(query.isLoading)return <div className="flex min-h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin"/></div>;
  return <div className="max-w-4xl space-y-4">
    <div className="flex items-center justify-between"><div><h3 className="text-lg font-bold">Thông báo khóa học</h3><p className="text-sm text-muted-foreground">Cập nhật mới nhất từ người giảng dạy.</p></div>{Boolean(unread.data)&&<span className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">{unread.data} mới</span>}</div>
    {items.length?items.map(item=><article id={'announcement-'+item._id} key={item._id} className={`rounded-2xl border bg-card p-5 ${item.unread?'border-primary/40 shadow-sm':'border-border'}`}>
      <button type="button" className="w-full text-left" onClick={()=>toggle(item._id)}><div className="flex gap-3"><UserAvatar user={{fullName:item.instructorName,avatarUrl:item.instructorAvatarUrl}} className="h-9 w-9 text-xs"/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold">{item.title}</h4>{item.pinnedAt&&<span className="inline-flex items-center gap-1 text-xs font-semibold text-primary"><Pin className="h-3 w-3 fill-current"/>Đã ghim</span>}{item.unread&&<span className="h-2 w-2 rounded-full bg-primary"/>}<ChevronDown className={`ml-auto h-4 w-4 transition-transform ${expanded===item._id?'rotate-180':''}`}/></div><p className="mt-1 text-xs text-muted-foreground">{item.instructorName} · {formatRelativeTime(item.publishedAt)}</p></div></div></button>
      {expanded===item._id&&<div className="prose prose-sm mt-4 max-w-none border-t pt-4 dark:prose-invert" dangerouslySetInnerHTML={{__html:item.content}}/>}
    </article>):<div className="rounded-2xl border border-dashed py-14 text-center text-sm text-muted-foreground"><Bell className="mx-auto mb-2 h-7 w-7 opacity-40"/>Chưa có thông báo nào.</div>}
    {query.hasNextPage&&<Button variant="outline" className="w-full" disabled={query.isFetchingNextPage} onClick={()=>void query.fetchNextPage()}>{query.isFetchingNextPage&&<Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Xem thêm</Button>}
  </div>;
}