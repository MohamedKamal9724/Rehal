import DOMPurify from 'dompurify';
/** All user-supplied printable HTML is sanitized before it reaches a new window. */
export function writeSafePrintDocument(target:Window, html:string):void {
 const clean=DOMPurify.sanitize(html,{WHOLE_DOCUMENT:true,ADD_TAGS:['style'],FORBID_TAGS:['script','iframe','object','embed','form','base','meta','link']});
 const policy="<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; img-src data: https:; style-src 'unsafe-inline'; font-src data:; base-uri 'none'; form-action 'none'\">";
 target.document.write(clean.replace('<head>','<head>'+policy));
}
