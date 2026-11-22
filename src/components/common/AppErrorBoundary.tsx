import React from 'react';
export class AppErrorBoundary extends React.Component<{children:React.ReactNode},{failed:boolean}> {
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<main dir="rtl" className="p-8 space-y-4"><h1>تعذّر عرض الصفحة</h1><p>لم نؤكد حفظ العملية الأخيرة. أعد تحميل الصفحة وراجع البيانات قبل المحاولة مجددًا.</p><button onClick={()=>location.reload()}>إعادة التحميل</button></main>:this.props.children;}
}
