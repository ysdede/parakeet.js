import{_ as vh}from"./index-d6d809af.js";function xh(he,Xt){for(var st=0;st<Xt.length;st++){const ze=Xt[st];if(typeof ze!="string"&&!Array.isArray(ze)){for(const Pe in ze)if(Pe!=="default"&&!(Pe in he)){const ot=Object.getOwnPropertyDescriptor(ze,Pe);ot&&Object.defineProperty(he,Pe,ot.get?ot:{enumerable:!0,get:()=>ze[Pe]})}}}return Object.freeze(Object.defineProperty(he,Symbol.toStringTag,{value:"Module"}))}function kh(he){return he&&he.__esModule&&Object.prototype.hasOwnProperty.call(he,"default")?he.default:he}function nt(he){throw new Error('Could not dynamically require "'+he+'". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.')}var Yd={exports:{}};(function(he,Xt){var st=(()=>{var ze=Object.defineProperty,Pe=Object.getOwnPropertyDescriptor,ot=Object.getOwnPropertyNames,ip=Object.prototype.hasOwnProperty,rp=(e=>typeof nt<"u"?nt:typeof Proxy<"u"?new Proxy(e,{get:(t,i)=>(typeof nt<"u"?nt:t)[i]}):e)(function(e){if(typeof nt<"u")return nt.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')}),E=(e,t)=>()=>(e&&(t=e(e=0)),t),Je=(e,t)=>{for(var i in t)ze(e,i,{get:t[i],enumerable:!0})},ap=(e,t,i,r)=>{if(t&&typeof t=="object"||typeof t=="function")for(let a of ot(t))!ip.call(e,a)&&a!==i&&ze(e,a,{get:()=>t[a],enumerable:!(r=Pe(t,a))||r.enumerable});return e},ut=e=>ap(ze({},"__esModule",{value:!0}),e),lt,Ae,Ue,qr,Nr,Vr=E(()=>{lt=new Map,Ae=[],Ue=(e,t,i)=>{if(t&&typeof t.init=="function"&&typeof t.createInferenceSessionHandler=="function"){let r=lt.get(e);if(r===void 0)lt.set(e,{backend:t,priority:i});else{if(r.priority>i)return;if(r.priority===i&&r.backend!==t)throw new Error(`cannot register backend "${e}" using priority ${i}`)}if(i>=0){let a=Ae.indexOf(e);a!==-1&&Ae.splice(a,1);for(let n=0;n<Ae.length;n++)if(lt.get(Ae[n]).priority<=i){Ae.splice(n,0,e);return}Ae.push(e)}return}throw new TypeError("not a valid backend")},qr=async e=>{let t=lt.get(e);if(!t)return"backend not found.";if(t.initialized)return t.backend;if(t.aborted)return t.error;{let i=!!t.initPromise;try{return i||(t.initPromise=t.backend.init(e)),await t.initPromise,t.initialized=!0,t.backend}catch(r){return i||(t.error=`${r}`,t.aborted=!0),t.error}finally{delete t.initPromise}}},Nr=async e=>{let t=e.executionProviders||[],i=t.map(u=>typeof u=="string"?u:u.name),r=i.length===0?Ae:i,a,n=[],s=new Set;for(let u of r){let l=await qr(u);typeof l=="string"?n.push({name:u,err:l}):(a||(a=l),a===l&&s.add(u))}if(!a)throw new Error(`no available backend found. ERR: ${n.map(u=>`[${u.name}] ${u.err}`).join(", ")}`);for(let{name:u,err:l}of n)i.includes(u)&&console.warn(`removing requested execution provider "${u}" from session options because it is not available: ${l}`);let o=t.filter(u=>s.has(typeof u=="string"?u:u.name));return[a,new Proxy(e,{get:(u,l)=>l==="executionProviders"?o:Reflect.get(u,l)})]}}),np=E(()=>{Vr()}),Lr,sp=E(()=>{Lr="1.22.0-dev.20250409-89f8206ba4"}),Yt,ge,Wr=E(()=>{sp(),Yt="warning",ge={wasm:{},webgl:{},webgpu:{},versions:{common:Lr},set logLevel(e){if(e!==void 0){if(typeof e!="string"||["verbose","info","warning","error","fatal"].indexOf(e)===-1)throw new Error(`Unsupported logging level: ${e}`);Yt=e}},get logLevel(){return Yt}},Object.defineProperty(ge,"logLevel",{enumerable:!0})}),te,op=E(()=>{Wr(),te=ge}),Gr,Hr,up=E(()=>{Gr=(e,t)=>{let i=typeof document<"u"?document.createElement("canvas"):new OffscreenCanvas(1,1);i.width=e.dims[3],i.height=e.dims[2];let r=i.getContext("2d");if(r!=null){let a,n;(t==null?void 0:t.tensorLayout)!==void 0&&t.tensorLayout==="NHWC"?(a=e.dims[2],n=e.dims[3]):(a=e.dims[3],n=e.dims[2]);let s=(t==null?void 0:t.format)!==void 0?t.format:"RGB",o=t==null?void 0:t.norm,u,l;o===void 0||o.mean===void 0?u=[255,255,255,255]:typeof o.mean=="number"?u=[o.mean,o.mean,o.mean,o.mean]:(u=[o.mean[0],o.mean[1],o.mean[2],0],o.mean[3]!==void 0&&(u[3]=o.mean[3])),o===void 0||o.bias===void 0?l=[0,0,0,0]:typeof o.bias=="number"?l=[o.bias,o.bias,o.bias,o.bias]:(l=[o.bias[0],o.bias[1],o.bias[2],0],o.bias[3]!==void 0&&(l[3]=o.bias[3]));let d=n*a,p=0,h=d,c=d*2,f=-1;s==="RGBA"?(p=0,h=d,c=d*2,f=d*3):s==="RGB"?(p=0,h=d,c=d*2):s==="RBG"&&(p=0,c=d,h=d*2);for(let m=0;m<n;m++)for(let y=0;y<a;y++){let _=(e.data[p++]-l[0])*u[0],g=(e.data[h++]-l[1])*u[1],w=(e.data[c++]-l[2])*u[2],$=f===-1?255:(e.data[f++]-l[3])*u[3];r.fillStyle="rgba("+_+","+g+","+w+","+$+")",r.fillRect(y,m,1,1)}if("toDataURL"in i)return i.toDataURL();throw new Error("toDataURL is not supported")}else throw new Error("Can not access image data")},Hr=(e,t)=>{let i=typeof document<"u"?document.createElement("canvas").getContext("2d"):new OffscreenCanvas(1,1).getContext("2d"),r;if(i!=null){let a,n,s;(t==null?void 0:t.tensorLayout)!==void 0&&t.tensorLayout==="NHWC"?(a=e.dims[2],n=e.dims[1],s=e.dims[3]):(a=e.dims[3],n=e.dims[2],s=e.dims[1]);let o=t!==void 0&&t.format!==void 0?t.format:"RGB",u=t==null?void 0:t.norm,l,d;u===void 0||u.mean===void 0?l=[255,255,255,255]:typeof u.mean=="number"?l=[u.mean,u.mean,u.mean,u.mean]:(l=[u.mean[0],u.mean[1],u.mean[2],255],u.mean[3]!==void 0&&(l[3]=u.mean[3])),u===void 0||u.bias===void 0?d=[0,0,0,0]:typeof u.bias=="number"?d=[u.bias,u.bias,u.bias,u.bias]:(d=[u.bias[0],u.bias[1],u.bias[2],0],u.bias[3]!==void 0&&(d[3]=u.bias[3]));let p=n*a;if(t!==void 0&&(t.format!==void 0&&s===4&&t.format!=="RGBA"||s===3&&t.format!=="RGB"&&t.format!=="BGR"))throw new Error("Tensor format doesn't match input tensor dims");let h=4,c=0,f=1,m=2,y=3,_=0,g=p,w=p*2,$=-1;o==="RGBA"?(_=0,g=p,w=p*2,$=p*3):o==="RGB"?(_=0,g=p,w=p*2):o==="RBG"&&(_=0,w=p,g=p*2),r=i.createImageData(a,n);for(let b=0;b<n*a;c+=h,f+=h,m+=h,y+=h,b++)r.data[c]=(e.data[_++]-d[0])*l[0],r.data[f]=(e.data[g++]-d[1])*l[1],r.data[m]=(e.data[w++]-d[2])*l[2],r.data[y]=$===-1?255:(e.data[$++]-d[3])*l[3]}else throw new Error("Can not access image data");return r}}),St,Fr,jr,Kr,Zr,Qr,lp=E(()=>{ei(),St=(e,t)=>{if(e===void 0)throw new Error("Image buffer must be defined");if(t.height===void 0||t.width===void 0)throw new Error("Image height and width must be defined");if(t.tensorLayout==="NHWC")throw new Error("NHWC Tensor layout is not supported yet");let{height:i,width:r}=t,a=t.norm??{mean:255,bias:0},n,s;typeof a.mean=="number"?n=[a.mean,a.mean,a.mean,a.mean]:n=[a.mean[0],a.mean[1],a.mean[2],a.mean[3]??255],typeof a.bias=="number"?s=[a.bias,a.bias,a.bias,a.bias]:s=[a.bias[0],a.bias[1],a.bias[2],a.bias[3]??0];let o=t.format!==void 0?t.format:"RGBA",u=t.tensorFormat!==void 0&&t.tensorFormat!==void 0?t.tensorFormat:"RGB",l=i*r,d=u==="RGBA"?new Float32Array(l*4):new Float32Array(l*3),p=4,h=0,c=1,f=2,m=3,y=0,_=l,g=l*2,w=-1;o==="RGB"&&(p=3,h=0,c=1,f=2,m=-1),u==="RGBA"?w=l*3:u==="RBG"?(y=0,g=l,_=l*2):u==="BGR"&&(g=0,_=l,y=l*2);for(let $=0;$<l;$++,h+=p,f+=p,c+=p,m+=p)d[y++]=(e[h]+s[0])/n[0],d[_++]=(e[c]+s[1])/n[1],d[g++]=(e[f]+s[2])/n[2],w!==-1&&m!==-1&&(d[w++]=(e[m]+s[3])/n[3]);return u==="RGBA"?new ce("float32",d,[1,4,i,r]):new ce("float32",d,[1,3,i,r])},Fr=async(e,t)=>{let i=typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement,r=typeof ImageData<"u"&&e instanceof ImageData,a=typeof ImageBitmap<"u"&&e instanceof ImageBitmap,n=typeof e=="string",s,o=t??{},u=()=>{if(typeof document<"u")return document.createElement("canvas");if(typeof OffscreenCanvas<"u")return new OffscreenCanvas(1,1);throw new Error("Canvas is not supported")},l=d=>typeof HTMLCanvasElement<"u"&&d instanceof HTMLCanvasElement||d instanceof OffscreenCanvas?d.getContext("2d"):null;if(i){let d=u();d.width=e.width,d.height=e.height;let p=l(d);if(p!=null){let h=e.height,c=e.width;if(t!==void 0&&t.resizedHeight!==void 0&&t.resizedWidth!==void 0&&(h=t.resizedHeight,c=t.resizedWidth),t!==void 0){if(o=t,t.tensorFormat!==void 0)throw new Error("Image input config format must be RGBA for HTMLImageElement");o.tensorFormat="RGBA",o.height=h,o.width=c}else o.tensorFormat="RGBA",o.height=h,o.width=c;p.drawImage(e,0,0),s=p.getImageData(0,0,c,h).data}else throw new Error("Can not access image data")}else if(r){let d,p;if(t!==void 0&&t.resizedWidth!==void 0&&t.resizedHeight!==void 0?(d=t.resizedHeight,p=t.resizedWidth):(d=e.height,p=e.width),t!==void 0&&(o=t),o.format="RGBA",o.height=d,o.width=p,t!==void 0){let h=u();h.width=p,h.height=d;let c=l(h);if(c!=null)c.putImageData(e,0,0),s=c.getImageData(0,0,p,d).data;else throw new Error("Can not access image data")}else s=e.data}else if(a){if(t===void 0)throw new Error("Please provide image config with format for Imagebitmap");let d=u();d.width=e.width,d.height=e.height;let p=l(d);if(p!=null){let h=e.height,c=e.width;return p.drawImage(e,0,0,c,h),s=p.getImageData(0,0,c,h).data,o.height=h,o.width=c,St(s,o)}else throw new Error("Can not access image data")}else{if(n)return new Promise((d,p)=>{let h=u(),c=l(h);if(!e||!c)return p();let f=new Image;f.crossOrigin="Anonymous",f.src=e,f.onload=()=>{h.width=f.width,h.height=f.height,c.drawImage(f,0,0,h.width,h.height);let m=c.getImageData(0,0,h.width,h.height);o.height=h.height,o.width=h.width,d(St(m.data,o))}});throw new Error("Input data provided is not supported - aborted tensor creation")}if(s!==void 0)return St(s,o);throw new Error("Input data provided is not supported - aborted tensor creation")},jr=(e,t)=>{let{width:i,height:r,download:a,dispose:n}=t,s=[1,r,i,4];return new ce({location:"texture",type:"float32",texture:e,dims:s,download:a,dispose:n})},Kr=(e,t)=>{let{dataType:i,dims:r,download:a,dispose:n}=t;return new ce({location:"gpu-buffer",type:i??"float32",gpuBuffer:e,dims:r,download:a,dispose:n})},Zr=(e,t)=>{let{dataType:i,dims:r,download:a,dispose:n}=t;return new ce({location:"ml-tensor",type:i??"float32",mlTensor:e,dims:r,download:a,dispose:n})},Qr=(e,t,i)=>new ce({location:"cpu-pinned",type:e,data:t,dims:i??[t.length]})}),qe,dt,Jt,Xr,dp=E(()=>{qe=new Map([["float32",Float32Array],["uint8",Uint8Array],["int8",Int8Array],["uint16",Uint16Array],["int16",Int16Array],["int32",Int32Array],["bool",Uint8Array],["float64",Float64Array],["uint32",Uint32Array],["int4",Uint8Array],["uint4",Uint8Array]]),dt=new Map([[Float32Array,"float32"],[Uint8Array,"uint8"],[Int8Array,"int8"],[Uint16Array,"uint16"],[Int16Array,"int16"],[Int32Array,"int32"],[Float64Array,"float64"],[Uint32Array,"uint32"]]),Jt=!1,Xr=()=>{if(!Jt){Jt=!0;let e=typeof BigInt64Array<"u"&&BigInt64Array.from,t=typeof BigUint64Array<"u"&&BigUint64Array.from,i=globalThis.Float16Array,r=typeof i<"u"&&i.from;e&&(qe.set("int64",BigInt64Array),dt.set(BigInt64Array,"int64")),t&&(qe.set("uint64",BigUint64Array),dt.set(BigUint64Array,"uint64")),r?(qe.set("float16",i),dt.set(i,"float16")):qe.set("float16",Uint16Array)}}}),Yr,Jr,pp=E(()=>{ei(),Yr=e=>{let t=1;for(let i=0;i<e.length;i++){let r=e[i];if(typeof r!="number"||!Number.isSafeInteger(r))throw new TypeError(`dims[${i}] must be an integer, got: ${r}`);if(r<0)throw new RangeError(`dims[${i}] must be a non-negative integer, got: ${r}`);t*=r}return t},Jr=(e,t)=>{switch(e.location){case"cpu":return new ce(e.type,e.data,t);case"cpu-pinned":return new ce({location:"cpu-pinned",data:e.data,type:e.type,dims:t});case"texture":return new ce({location:"texture",texture:e.texture,type:e.type,dims:t});case"gpu-buffer":return new ce({location:"gpu-buffer",gpuBuffer:e.gpuBuffer,type:e.type,dims:t});case"ml-tensor":return new ce({location:"ml-tensor",mlTensor:e.mlTensor,type:e.type,dims:t});default:throw new Error(`tensorReshape: tensor location ${e.location} is not supported`)}}}),ce,ei=E(()=>{up(),lp(),dp(),pp(),ce=class{constructor(e,t,i){Xr();let r,a;if(typeof e=="object"&&"location"in e)switch(this.dataLocation=e.location,r=e.type,a=e.dims,e.location){case"cpu-pinned":{let s=qe.get(r);if(!s)throw new TypeError(`unsupported type "${r}" to create tensor from pinned buffer`);if(!(e.data instanceof s))throw new TypeError(`buffer should be of type ${s.name}`);this.cpuData=e.data;break}case"texture":{if(r!=="float32")throw new TypeError(`unsupported type "${r}" to create tensor from texture`);this.gpuTextureData=e.texture,this.downloader=e.download,this.disposer=e.dispose;break}case"gpu-buffer":{if(r!=="float32"&&r!=="float16"&&r!=="int32"&&r!=="int64"&&r!=="uint32"&&r!=="uint8"&&r!=="bool"&&r!=="uint4"&&r!=="int4")throw new TypeError(`unsupported type "${r}" to create tensor from gpu buffer`);this.gpuBufferData=e.gpuBuffer,this.downloader=e.download,this.disposer=e.dispose;break}case"ml-tensor":{if(r!=="float32"&&r!=="float16"&&r!=="int32"&&r!=="int64"&&r!=="uint32"&&r!=="uint64"&&r!=="int8"&&r!=="uint8"&&r!=="bool"&&r!=="uint4"&&r!=="int4")throw new TypeError(`unsupported type "${r}" to create tensor from MLTensor`);this.mlTensorData=e.mlTensor,this.downloader=e.download,this.disposer=e.dispose;break}default:throw new Error(`Tensor constructor: unsupported location '${this.dataLocation}'`)}else{let s,o;if(typeof e=="string")if(r=e,o=i,e==="string"){if(!Array.isArray(t))throw new TypeError("A string tensor's data must be a string array.");s=t}else{let u=qe.get(e);if(u===void 0)throw new TypeError(`Unsupported tensor type: ${e}.`);if(Array.isArray(t)){if(e==="float16"&&u===Uint16Array||e==="uint4"||e==="int4")throw new TypeError(`Creating a ${e} tensor from number array is not supported. Please use ${u.name} as data.`);e==="uint64"||e==="int64"?s=u.from(t,BigInt):s=u.from(t)}else if(t instanceof u)s=t;else if(t instanceof Uint8ClampedArray)if(e==="uint8")s=Uint8Array.from(t);else throw new TypeError("A Uint8ClampedArray tensor's data must be type of uint8");else if(e==="float16"&&t instanceof Uint16Array&&u!==Uint16Array)s=new globalThis.Float16Array(t.buffer,t.byteOffset,t.length);else throw new TypeError(`A ${r} tensor's data must be type of ${u}`)}else if(o=t,Array.isArray(e)){if(e.length===0)throw new TypeError("Tensor type cannot be inferred from an empty array.");let u=typeof e[0];if(u==="string")r="string",s=e;else if(u==="boolean")r="bool",s=Uint8Array.from(e);else throw new TypeError(`Invalid element type of data array: ${u}.`)}else if(e instanceof Uint8ClampedArray)r="uint8",s=Uint8Array.from(e);else{let u=dt.get(e.constructor);if(u===void 0)throw new TypeError(`Unsupported type for tensor data: ${e.constructor}.`);r=u,s=e}if(o===void 0)o=[s.length];else if(!Array.isArray(o))throw new TypeError("A tensor's dims must be a number array");a=o,this.cpuData=s,this.dataLocation="cpu"}let n=Yr(a);if(this.cpuData&&n!==this.cpuData.length&&!((r==="uint4"||r==="int4")&&Math.ceil(n/2)===this.cpuData.length))throw new Error(`Tensor's size(${n}) does not match data length(${this.cpuData.length}).`);this.type=r,this.dims=a,this.size=n}static async fromImage(e,t){return Fr(e,t)}static fromTexture(e,t){return jr(e,t)}static fromGpuBuffer(e,t){return Kr(e,t)}static fromMLTensor(e,t){return Zr(e,t)}static fromPinnedBuffer(e,t,i){return Qr(e,t,i)}toDataURL(e){return Gr(this,e)}toImageData(e){return Hr(this,e)}get data(){if(this.ensureValid(),!this.cpuData)throw new Error("The data is not on CPU. Use `getData()` to download GPU data to CPU, or use `texture` or `gpuBuffer` property to access the GPU data directly.");return this.cpuData}get location(){return this.dataLocation}get texture(){if(this.ensureValid(),!this.gpuTextureData)throw new Error("The data is not stored as a WebGL texture.");return this.gpuTextureData}get gpuBuffer(){if(this.ensureValid(),!this.gpuBufferData)throw new Error("The data is not stored as a WebGPU buffer.");return this.gpuBufferData}get mlTensor(){if(this.ensureValid(),!this.mlTensorData)throw new Error("The data is not stored as a WebNN MLTensor.");return this.mlTensorData}async getData(e){switch(this.ensureValid(),this.dataLocation){case"cpu":case"cpu-pinned":return this.data;case"texture":case"gpu-buffer":case"ml-tensor":{if(!this.downloader)throw new Error("The current tensor is not created with a specified data downloader.");if(this.isDownloading)throw new Error("The current tensor is being downloaded.");try{this.isDownloading=!0;let t=await this.downloader();return this.downloader=void 0,this.dataLocation="cpu",this.cpuData=t,e&&this.disposer&&(this.disposer(),this.disposer=void 0),t}finally{this.isDownloading=!1}}default:throw new Error(`cannot get data from location: ${this.dataLocation}`)}}dispose(){if(this.isDownloading)throw new Error("The current tensor is being downloaded.");this.disposer&&(this.disposer(),this.disposer=void 0),this.cpuData=void 0,this.gpuTextureData=void 0,this.gpuBufferData=void 0,this.mlTensorData=void 0,this.downloader=void 0,this.isDownloading=void 0,this.dataLocation="none"}ensureValid(){if(this.dataLocation==="none")throw new Error("The tensor is disposed.")}reshape(e){if(this.ensureValid(),this.downloader||this.disposer)throw new Error("Cannot reshape a tensor that owns GPU resource.");return Jr(this,e)}}}),ye,ea=E(()=>{ei(),ye=ce}),pt,ti,$e,_e,ta=E(()=>{Wr(),pt=(e,t)=>{(typeof ge.trace>"u"?!ge.wasm.trace:!ge.trace)||console.timeStamp(`${e}::ORT::${t}`)},ti=(e,t)=>{var a;let i=((a=new Error().stack)==null?void 0:a.split(/\r\n|\r|\n/g))||[],r=!1;for(let n=0;n<i.length;n++){if(r&&!i[n].includes("TRACE_FUNC")){let s=`FUNC_${e}::${i[n].trim().split(" ")[1]}`;t&&(s+=`::${t}`),pt("CPU",s);return}i[n].includes("TRACE_FUNC")&&(r=!0)}},$e=e=>{(typeof ge.trace>"u"?!ge.wasm.trace:!ge.trace)||ti("BEGIN",e)},_e=e=>{(typeof ge.trace>"u"?!ge.wasm.trace:!ge.trace)||ti("END",e)}}),ia,hp=E(()=>{Vr(),ea(),ta(),ia=class Jd{constructor(t){this.handler=t}async run(t,i,r){$e();let a={},n={};if(typeof t!="object"||t===null||t instanceof ye||Array.isArray(t))throw new TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");let s=!0;if(typeof i=="object"){if(i===null)throw new TypeError("Unexpected argument[1]: cannot be null.");if(i instanceof ye)throw new TypeError("'fetches' cannot be a Tensor");if(Array.isArray(i)){if(i.length===0)throw new TypeError("'fetches' cannot be an empty array.");s=!1;for(let l of i){if(typeof l!="string")throw new TypeError("'fetches' must be a string array or an object.");if(this.outputNames.indexOf(l)===-1)throw new RangeError(`'fetches' contains invalid output name: ${l}.`);a[l]=null}if(typeof r=="object"&&r!==null)n=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else{let l=!1,d=Object.getOwnPropertyNames(i);for(let p of this.outputNames)if(d.indexOf(p)!==-1){let h=i[p];(h===null||h instanceof ye)&&(l=!0,s=!1,a[p]=h)}if(l){if(typeof r=="object"&&r!==null)n=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else n=i}}else if(typeof i<"u")throw new TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");for(let l of this.inputNames)if(typeof t[l]>"u")throw new Error(`input '${l}' is missing in 'feeds'.`);if(s)for(let l of this.outputNames)a[l]=null;let o=await this.handler.run(t,a,n),u={};for(let l in o)if(Object.hasOwnProperty.call(o,l)){let d=o[l];d instanceof ye?u[l]=d:u[l]=new ye(d.type,d.data,d.dims)}return _e(),u}async release(){return this.handler.dispose()}static async create(t,i,r,a){$e();let n,s={};if(typeof t=="string"){if(n=t,typeof i=="object"&&i!==null)s=i;else if(typeof i<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof Uint8Array){if(n=t,typeof i=="object"&&i!==null)s=i;else if(typeof i<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof ArrayBuffer||typeof SharedArrayBuffer<"u"&&t instanceof SharedArrayBuffer){let d=t,p=0,h=t.byteLength;if(typeof i=="object"&&i!==null)s=i;else if(typeof i=="number"){if(p=i,!Number.isSafeInteger(p))throw new RangeError("'byteOffset' must be an integer.");if(p<0||p>=d.byteLength)throw new RangeError(`'byteOffset' is out of range [0, ${d.byteLength}).`);if(h=t.byteLength-p,typeof r=="number"){if(h=r,!Number.isSafeInteger(h))throw new RangeError("'byteLength' must be an integer.");if(h<=0||p+h>d.byteLength)throw new RangeError(`'byteLength' is out of range (0, ${d.byteLength-p}].`);if(typeof a=="object"&&a!==null)s=a;else if(typeof a<"u")throw new TypeError("'options' must be an object.")}else if(typeof r<"u")throw new TypeError("'byteLength' must be a number.")}else if(typeof i<"u")throw new TypeError("'options' must be an object.");n=new Uint8Array(d,p,h)}else throw new TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");let[o,u]=await Nr(s),l=await o.createInferenceSessionHandler(n,u);return _e(),new Jd(l)}startProfiling(){this.handler.startProfiling()}endProfiling(){this.handler.endProfiling()}get inputNames(){return this.handler.inputNames}get outputNames(){return this.handler.outputNames}get inputMetadata(){return this.handler.inputMetadata}get outputMetadata(){return this.handler.outputMetadata}}}),ii,cp=E(()=>{hp(),ii=ia}),fp=E(()=>{}),mp=E(()=>{}),gp=E(()=>{}),_p=E(()=>{}),ra={};Je(ra,{InferenceSession:()=>ii,TRACE:()=>pt,TRACE_FUNC_BEGIN:()=>$e,TRACE_FUNC_END:()=>_e,Tensor:()=>ye,env:()=>te,registerBackend:()=>Ue});var we=E(()=>{np(),op(),cp(),ea(),fp(),mp(),ta(),gp(),_p()}),ri=E(()=>{}),aa={};Je(aa,{default:()=>na});var ai,ni,na,yp=E(()=>{var e;Pd(),Ne(),di(),ai="ort-wasm-proxy-worker",ni=((e=globalThis.self)==null?void 0:e.name)===ai,ni&&(self.onmessage=t=>{let{type:i,in:r}=t.data;try{switch(i){case"init-wasm":ci(r.wasm).then(()=>{Sr(r).then(()=>{postMessage({type:i})},a=>{postMessage({type:i,err:a})})},a=>{postMessage({type:i,err:a})});break;case"init-ep":{let{epName:a,env:n}=r;Tr(n,a).then(()=>{postMessage({type:i})},s=>{postMessage({type:i,err:s})});break}case"copy-from":{let{buffer:a}=r,n=Ht(a);postMessage({type:i,out:n});break}case"create":{let{model:a,options:n}=r;Er(a,n).then(s=>{postMessage({type:i,out:s})},s=>{postMessage({type:i,err:s})});break}case"release":Cr(r),postMessage({type:i});break;case"run":{let{sessionId:a,inputIndices:n,inputs:s,outputIndices:o,options:u}=r;Ar(a,n,s,o,new Array(o.length).fill(null),u).then(l=>{l.some(d=>d[3]!=="cpu")?postMessage({type:i,err:"Proxy does not support non-cpu tensor location."}):postMessage({type:i,out:l},Rr([...s,...l]))},l=>{postMessage({type:i,err:l})});break}case"end-profiling":Or(r),postMessage({type:i});break;default:}}catch(a){postMessage({type:i,err:a})}}),na=ni?null:t=>new Worker(t??fe,{type:"classic",name:ai})}),sa,oa,fe,si,Tt,ua,la,oi,da,ui,pa,li,ha,di=E(()=>{ri(),sa=typeof location>"u"?void 0:location.origin,oa=()=>{var e,t;return typeof document<"u"?(e=document.currentScript)==null?void 0:e.src:typeof self<"u"?(t=self.location)==null?void 0:t.href:void 0},fe=oa(),si=()=>{if(fe&&!fe.startsWith("blob:"))return fe.substring(0,fe.lastIndexOf("/")+1)},Tt=(e,t)=>{try{let i=t??fe;return(i?new URL(e,i):new URL(e)).origin===sa}catch{return!1}},ua=(e,t)=>{let i=t??fe;try{return(i?new URL(e,i):new URL(e)).href}catch{return}},la=(e,t)=>`${t??"./"}${e}`,oi=async e=>{let t=await(await fetch(e,{credentials:"same-origin"})).blob();return URL.createObjectURL(t)},da=async e=>(await vh(()=>import(e),[])).default,ui=(yp(),ut(aa)).default,pa=async()=>{if(!fe)throw new Error("Failed to load proxy worker: cannot determine the script source URL.");if(Tt(fe))return[void 0,ui()];let e=await oi(fe);return[e,ui(e)]},li=void 0,ha=async(e,t,i)=>{if(!e&&!t&&li&&fe&&Tt(fe))return[void 0,li];{let r="ort-wasm-simd-threaded.jsep.mjs",a=e??ua(r,t),n=i&&a&&!Tt(a,t),s=n?await oi(a):a??la(r,t);return[n?s:void 0,await da(s)]}}}),pi,zt,ht,hi,ca,fa,ma,ci,ee,Ne=E(()=>{di(),zt=!1,ht=!1,hi=!1,ca=()=>{if(typeof SharedArrayBuffer>"u")return!1;try{return typeof MessageChannel<"u"&&new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)),WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,5,4,1,3,1,1,10,11,1,9,0,65,0,254,16,2,0,26,11]))}catch{return!1}},fa=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,10,30,1,28,0,65,0,253,15,253,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,253,186,1,26,11]))}catch{return!1}},ma=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,19,1,17,0,65,1,253,15,65,2,253,15,65,3,253,15,253,147,2,11]))}catch{return!1}},ci=async e=>{if(zt)return Promise.resolve();if(ht)throw new Error("multiple calls to 'initializeWebAssembly()' detected.");if(hi)throw new Error("previous call to 'initializeWebAssembly()' failed.");ht=!0;let t=e.initTimeout,i=e.numThreads;if(e.simd!==!1){if(e.simd==="relaxed"){if(!ma())throw new Error("Relaxed WebAssembly SIMD is not supported in the current environment.")}else if(!fa())throw new Error("WebAssembly SIMD is not supported in the current environment.")}let r=ca();i>1&&!r&&(typeof self<"u"&&!self.crossOriginIsolated&&console.warn("env.wasm.numThreads is set to "+i+", but this will not work unless you enable crossOriginIsolated mode. See https://web.dev/cross-origin-isolation-guide/ for more info."),console.warn("WebAssembly multi-threading is not supported in the current environment. Falling back to single-threading."),e.numThreads=i=1);let a=e.wasmPaths,n=typeof a=="string"?a:void 0,s=a==null?void 0:a.mjs,o=(s==null?void 0:s.href)??s,u=a==null?void 0:a.wasm,l=(u==null?void 0:u.href)??u,d=e.wasmBinary,[p,h]=await ha(o,n,i>1),c=!1,f=[];if(t>0&&f.push(new Promise(m=>{setTimeout(()=>{c=!0,m()},t)})),f.push(new Promise((m,y)=>{let _={numThreads:i};if(d)_.wasmBinary=d;else if(l||n)_.locateFile=g=>l??n+g;else if(o&&o.indexOf("blob:")!==0)_.locateFile=g=>new URL(g,o).href;else if(p){let g=si();g&&(_.locateFile=w=>g+w)}h(_).then(g=>{ht=!1,zt=!0,pi=g,m(),p&&URL.revokeObjectURL(p)},g=>{ht=!1,hi=!0,y(g)})})),await Promise.race(f),c)throw new Error(`WebAssembly backend initializing failed due to timeout: ${t}ms`)},ee=()=>{if(zt&&pi)return pi;throw new Error("WebAssembly is not initialized yet.")}}),be,Et,Y,fi=E(()=>{Ne(),be=(e,t)=>{let i=ee(),r=i.lengthBytesUTF8(e)+1,a=i._malloc(r);return i.stringToUTF8(e,a,r),t.push(a),a},Et=(e,t,i,r)=>{if(typeof e=="object"&&e!==null){if(i.has(e))throw new Error("Circular reference in options");i.add(e)}Object.entries(e).forEach(([a,n])=>{let s=t?t+a:a;if(typeof n=="object")Et(n,s+".",i,r);else if(typeof n=="string"||typeof n=="number")r(s,n.toString());else if(typeof n=="boolean")r(s,n?"1":"0");else throw new Error(`Can't handle extra config type: ${typeof n}`)})},Y=e=>{let t=ee(),i=t.stackSave();try{let r=t.PTR_SIZE,a=t.stackAlloc(2*r);t._OrtGetLastError(a,a+r);let n=Number(t.getValue(a,r===4?"i32":"i64")),s=t.getValue(a+r,"*"),o=s?t.UTF8ToString(s):"";throw new Error(`${e} ERROR_CODE: ${n}, ERROR_MESSAGE: ${o}`)}finally{t.stackRestore(i)}}}),ga,$p=E(()=>{Ne(),fi(),ga=e=>{let t=ee(),i=0,r=[],a=e||{};try{if((e==null?void 0:e.logSeverityLevel)===void 0)a.logSeverityLevel=2;else if(typeof e.logSeverityLevel!="number"||!Number.isInteger(e.logSeverityLevel)||e.logSeverityLevel<0||e.logSeverityLevel>4)throw new Error(`log serverity level is not valid: ${e.logSeverityLevel}`);if((e==null?void 0:e.logVerbosityLevel)===void 0)a.logVerbosityLevel=0;else if(typeof e.logVerbosityLevel!="number"||!Number.isInteger(e.logVerbosityLevel))throw new Error(`log verbosity level is not valid: ${e.logVerbosityLevel}`);(e==null?void 0:e.terminate)===void 0&&(a.terminate=!1);let n=0;return(e==null?void 0:e.tag)!==void 0&&(n=be(e.tag,r)),i=t._OrtCreateRunOptions(a.logSeverityLevel,a.logVerbosityLevel,!!a.terminate,n),i===0&&Y("Can't create run options."),(e==null?void 0:e.extra)!==void 0&&Et(e.extra,"",new WeakSet,(s,o)=>{let u=be(s,r),l=be(o,r);t._OrtAddRunConfigEntry(i,u,l)!==0&&Y(`Can't set a run config entry: ${s} - ${o}.`)}),[i,r]}catch(n){throw i!==0&&t._OrtReleaseRunOptions(i),r.forEach(s=>t._free(s)),n}}}),_a,ya,$a,ct,wa,ba,wp=E(()=>{Ne(),fi(),_a=e=>{switch(e){case"disabled":return 0;case"basic":return 1;case"extended":return 2;case"all":return 99;default:throw new Error(`unsupported graph optimization level: ${e}`)}},ya=e=>{switch(e){case"sequential":return 0;case"parallel":return 1;default:throw new Error(`unsupported execution mode: ${e}`)}},$a=e=>{e.extra||(e.extra={}),e.extra.session||(e.extra.session={});let t=e.extra.session;t.use_ort_model_bytes_directly||(t.use_ort_model_bytes_directly="1"),e.executionProviders&&e.executionProviders.some(i=>(typeof i=="string"?i:i.name)==="webgpu")&&(e.enableMemPattern=!1)},ct=(e,t,i,r)=>{let a=be(t,r),n=be(i,r);ee()._OrtAddSessionConfigEntry(e,a,n)!==0&&Y(`Can't set a session config entry: ${t} - ${i}.`)},wa=async(e,t,i)=>{for(let r of t){let a=typeof r=="string"?r:r.name,n=[];switch(a){case"webnn":if(a="WEBNN",typeof r!="string"){let d=r==null?void 0:r.deviceType;d&&ct(e,"deviceType",d,i)}break;case"webgpu":if(a="JS",typeof r!="string"){let d=r;if(d!=null&&d.preferredLayout){if(d.preferredLayout!=="NCHW"&&d.preferredLayout!=="NHWC")throw new Error(`preferredLayout must be either 'NCHW' or 'NHWC': ${d.preferredLayout}`);ct(e,"preferredLayout",d.preferredLayout,i)}}break;case"wasm":case"cpu":continue;default:throw new Error(`not supported execution provider: ${a}`)}let s=be(a,i),o=n.length,u=0,l=0;if(o>0){u=ee()._malloc(o*ee().PTR_SIZE),i.push(u),l=ee()._malloc(o*ee().PTR_SIZE),i.push(l);for(let d=0;d<o;d++)ee().setValue(u+d*ee().PTR_SIZE,n[d][0],"*"),ee().setValue(l+d*ee().PTR_SIZE,n[d][1],"*")}await ee()._OrtAppendExecutionProvider(e,s,u,l,o)!==0&&Y(`Can't append execution provider: ${a}.`)}},ba=async e=>{let t=ee(),i=0,r=[],a=e||{};$a(a);try{let n=_a(a.graphOptimizationLevel??"all"),s=ya(a.executionMode??"sequential"),o=typeof a.logId=="string"?be(a.logId,r):0,u=a.logSeverityLevel??2;if(!Number.isInteger(u)||u<0||u>4)throw new Error(`log serverity level is not valid: ${u}`);let l=a.logVerbosityLevel??0;if(!Number.isInteger(l)||l<0||l>4)throw new Error(`log verbosity level is not valid: ${l}`);let d=typeof a.optimizedModelFilePath=="string"?be(a.optimizedModelFilePath,r):0;if(i=t._OrtCreateSessionOptions(n,!!a.enableCpuMemArena,!!a.enableMemPattern,s,!!a.enableProfiling,0,o,u,l,d),i===0&&Y("Can't create session options."),a.executionProviders&&await wa(i,a.executionProviders,r),a.enableGraphCapture!==void 0){if(typeof a.enableGraphCapture!="boolean")throw new Error(`enableGraphCapture must be a boolean value: ${a.enableGraphCapture}`);ct(i,"enableGraphCapture",a.enableGraphCapture.toString(),r)}if(a.freeDimensionOverrides)for(let[p,h]of Object.entries(a.freeDimensionOverrides)){if(typeof p!="string")throw new Error(`free dimension override name must be a string: ${p}`);if(typeof h!="number"||!Number.isInteger(h)||h<0)throw new Error(`free dimension override value must be a non-negative integer: ${h}`);let c=be(p,r);t._OrtAddFreeDimensionOverride(i,c,h)!==0&&Y(`Can't set a free dimension override: ${p} - ${h}.`)}return a.extra!==void 0&&Et(a.extra,"",new WeakSet,(p,h)=>{ct(i,p,h,r)}),[i,r]}catch(n){throw i!==0&&t._OrtReleaseSessionOptions(i)!==0&&Y("Can't release session options."),r.forEach(s=>t._free(s)),n}}}),et,Ee,Ve,mi,Ct,gi,_i,yi,V=E(()=>{et=e=>{switch(e){case"int8":return 3;case"uint8":return 2;case"bool":return 9;case"int16":return 5;case"uint16":return 4;case"int32":return 6;case"uint32":return 12;case"float16":return 10;case"float32":return 1;case"float64":return 11;case"string":return 8;case"int64":return 7;case"uint64":return 13;case"int4":return 22;case"uint4":return 21;default:throw new Error(`unsupported data type: ${e}`)}},Ee=e=>{switch(e){case 3:return"int8";case 2:return"uint8";case 9:return"bool";case 5:return"int16";case 4:return"uint16";case 6:return"int32";case 12:return"uint32";case 10:return"float16";case 1:return"float32";case 11:return"float64";case 8:return"string";case 7:return"int64";case 13:return"uint64";case 22:return"int4";case 21:return"uint4";default:throw new Error(`unsupported data type: ${e}`)}},Ve=(e,t)=>{let i=[-1,4,1,1,2,2,4,8,-1,1,2,8,4,8,-1,-1,-1,-1,-1,-1,-1,.5,.5][e],r=typeof t=="number"?t:t.reduce((a,n)=>a*n,1);return i>0?Math.ceil(r*i):void 0},mi=e=>{switch(e){case"float16":return typeof Float16Array<"u"&&Float16Array.from?Float16Array:Uint16Array;case"float32":return Float32Array;case"uint8":return Uint8Array;case"int8":return Int8Array;case"uint16":return Uint16Array;case"int16":return Int16Array;case"int32":return Int32Array;case"bool":return Uint8Array;case"float64":return Float64Array;case"uint32":return Uint32Array;case"int64":return BigInt64Array;case"uint64":return BigUint64Array;default:throw new Error(`unsupported type: ${e}`)}},Ct=e=>{switch(e){case"verbose":return 0;case"info":return 1;case"warning":return 2;case"error":return 3;case"fatal":return 4;default:throw new Error(`unsupported logging level: ${e}`)}},gi=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",_i=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint64"||e==="int8"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",yi=e=>{switch(e){case"none":return 0;case"cpu":return 1;case"cpu-pinned":return 2;case"texture":return 3;case"gpu-buffer":return 4;case"ml-tensor":return 5;default:throw new Error(`unsupported data location: ${e}`)}}}),$i,va=E(()=>{ri(),$i=async e=>{if(typeof e=="string"){let t=await fetch(e);if(!t.ok)throw new Error(`failed to load external data file: ${e}`);let i=t.headers.get("Content-Length"),r=i?parseInt(i,10):0;if(r<1073741824)return new Uint8Array(await t.arrayBuffer());{if(!t.body)throw new Error(`failed to load external data file: ${e}, no response body.`);let a=t.body.getReader(),n;try{n=new ArrayBuffer(r)}catch(o){if(o instanceof RangeError){let u=Math.ceil(r/65536);n=new WebAssembly.Memory({initial:u,maximum:u}).buffer}else throw o}let s=0;for(;;){let{done:o,value:u}=await a.read();if(o)break;let l=u.byteLength;new Uint8Array(n,s,l).set(u),s+=l}return new Uint8Array(n,0,r)}}else return e instanceof Blob?new Uint8Array(await e.arrayBuffer()):e instanceof Uint8Array?e:new Uint8Array(e)}}),xa,ka,Ia,Sa,wi,Ta,F,Ce=E(()=>{V(),xa=["V","I","W","E","F"],ka=(e,t)=>{console.log(`[${xa[e]},${new Date().toISOString()}]${t}`)},wi=(e,t)=>{Ia=e,Sa=t},Ta=(e,t)=>{let i=Ct(e),r=Ct(Ia);i>=r&&ka(i,typeof t=="function"?t():t)},F=(...e)=>{Sa&&Ta(...e)}}),za,tt,k,Bt,Ea,Ca,Ba,L=E(()=>{za=class{static calcMatMulShape(e,t){return e[1]!==t[0]?void 0:[e[0],t[1]]}},tt=class{static calcShape(e,t,i=!1){let r=e.length,a=t.length;if(r===0)return t;if(a===0)return e;let n=Math.max(e.length,t.length),s=new Array(n);if(i){if(r<2||a<2)return;let o=za.calcMatMulShape([e[r-2],e[r-1]],[t[a-2],t[a-1]]);if(o===void 0)return;[s[n-2],s[n-1]]=o}for(let o=i?3:1;o<=n;o++){let u=r-o<0?1:e[r-o],l=a-o<0?1:t[a-o];if(u!==l&&u>1&&l>1)return;let d=Math.max(u,l);if(u&&l)s[n-o]=Math.max(u,l);else{if(d>1)return;s[n-o]=0}}return s}static isValidBroadcast(e,t){let i=e.length,r=t.length;if(i>r)return!1;for(let a=1;a<=i;a++)if(e[i-a]!==1&&e[i-a]!==t[r-a])return!1;return!0}},k=class Qt{static size(t){return Qt.getSizeFromDimensionRange(t,0,t.length)}static convertShape(t,i=4){let r=t.length;if(r===0)return[];let a=new Array(r),n=r-1;for(;n>=0;){if(t[n]%i===0){a[n]=t[n]/i;break}if(i%t[n]!==0)throw new Error("cannot convert shape");a[n]=1,i/=t[n],n--}for(n--;n>=0;n--)a[n]=t[n];return a}static sizeFromDimension(t,i){if(i<0||i>t.length)throw new Error(`invalid dimension of ${i} for sizeFromDimension as Tensor has ${t.length} dimensions.`);return Qt.getSizeFromDimensionRange(t,i,t.length)}static sizeToDimension(t,i){if(i<0||i>t.length)throw new Error(`invalid dimension of ${i} for sizeToDimension as Tensor has ${t.length} dimensions.`);return Qt.getSizeFromDimensionRange(t,0,i)}static getSizeFromDimensionRange(t,i,r){let a=1;for(let n=i;n<r;n++){if(t[n]<0)throw new Error("cannot get valid size from specified dimension range. Most likely the range contains negative values in them.");a*=Number(t[n])}return a}static computeStrides(t){let i=t.length;if(i===0)return[];if(i===1)return[1];let r=new Array(i);r[i-1]=1,r[i-2]=t[i-1];for(let a=i-3;a>=0;--a)r[a]=r[a+1]*t[a+1];return r}static normalizeAxis(t,i){if(t<-i&&t>=i)throw new Error("unsupported axis for this operation.");return t<0?t+i:t}static normalizeAxes(t,i){return t.map(r=>this.normalizeAxis(r,i??t.length))}static sortBasedOnPerm(t,i){return i?i.map(r=>t[r]):t.slice().reverse()}static padShape(t,i){let r=t.length;return t.map((a,n)=>a+i[n]+i[n+r])}static areEqual(t,i){return t.length!==i.length?!1:t.every((r,a)=>r===i[a])}},Bt=class It{static adjustPoolAttributes(t,i,r,a,n,s){if(!t&&r.length!==i.length-2)throw new Error("length of specified kernel shapes should be 2 less than length of input dimensions");if(t)for(let o=0;o<i.length-2;o++)o>=r.length?r.push(i[o+2]):r[o]=i[o+2];for(let o=0;o<r.length;o++)if(o<a.length){if(a[o]<0)throw new Error("strides should be greater than or equal to 1")}else a.push(1);for(let o=0;o<r.length;o++)if(o<n.length){if(n[o]<0)throw new Error("dilations should be greater than or equal to 1")}else n.push(1);for(let o=0;o<r.length*2;o++)if(o<s.length){if(s[o]<0)throw new Error("pad should be greater than or equal to 1")}else s.push(0);for(let o=0;o<r.length;o++){if(r[o]<=0)throw new Error("kernel shapes need to be greater than 0");if(s[o]>=r[o]||s[o+r.length]>=r[o])throw new Error("pads should be smaller than kernel")}}static adjustPadsBasedOnAutoPad(t,i,r,a,n,s,o){if(o){if(n.length!==2*(t.length-2))throw new Error("length of pads should be twice the length of data dimensions");if(i.length!==t.length-2)throw new Error("length of strides should be the length of data dimensions");if(a.length!==t.length-2)throw new Error("length of kernel shapes should be the length of data dimensions");for(let u=0;u<t.length-2;u++)It.adjustPadAndReturnShape(t[u+(s?1:2)],i[u],r[u],a[u],n,u,u+t.length-2,o)}}static computePoolOutputShape(t,i,r,a,n,s,o){if(i.length<=0)throw new Error("input shape must be of size greater than 0");let u=[i[0],i[1]];return It.computeShapeHelper(t,i,u,r,a,n,s,o),u}static computeConvOutputShape(t,i,r,a,n,s,o){if(t.length<=0||i.length<=0)throw new Error("invalid input tensor dims or invalid filter tensor dims");let u=[t[0],i[0]];return It.computeShapeHelper(!1,t,u,r,a,n,s,o),u}static computeShapeHelper(t,i,r,a,n,s,o,u){if(t)for(let l=0;l<i.length-2;l++)r.push(1);else for(let l=0;l<i.length-2;l++)r.push(It.adjustPadAndReturnShape(i[l+2],a[l],n[l],s[l],o,l,l+i.length-2,u))}static adjustPadAndReturnShape(t,i,r,a,n,s,o,u){let l=r*(a-1)+1;if(u&&u!=="NOTSET")switch(u){case"VALID":return n[s]=0,n[o]=0,Math.floor((t-l)/i+1);case"SAME_LOWER":case"SAME_UPPER":if(r!==1)throw new Error("Dilation not supported for SAME_UPPER or SAME_LOWER");{let d=((t+i-1)/i-1)*i+a-t;return n[s]=Math.floor(u==="SAME_LOWER"?(d+1)/2:d/2),n[o]=d-n[s],Math.floor((t+d-a)/i+1)}default:throw new Error("Unsupported AutoPad type")}else return Math.floor((t+n[s]+n[o]-l)/i+1)}},Ea=class{static getShapeOfGemmResult(e,t,i,r,a){if(e.length!==2||i.length!==2)throw new Error("shape need to be of size 2");let n,s,o;t?(n=e[1],s=e[0]):(n=e[0],s=e[1]);let u=-1;if(r?(o=i[0],u=1):(o=i[1],u=0),i[u]!==s)throw new Error("dimension mismatch");if(n<=0||o<=0||s<=0)throw new Error("invalid shape specified");if(a&&!tt.isValidBroadcast(a,[n,o]))throw new Error("gemm: invalid bias shape for broadcast");return[n,o,s]}},Ca=-34028234663852886e22,Ba=34028234663852886e22}),bi,Aa=E(()=>{V(),bi=(e,t)=>new(mi(t))(e)}),vi,xi,Oa,ki,Ra,Ii,Si,Ti,Da,Ma,bp=E(()=>{Ce(),vi=(e,t=!0)=>{if(e.byteLength%8!==0)throw new Error("Invalid Uint8Array length - must be a multiple of 8 (BigInt).");let i=e.byteLength/8,r=new BigInt64Array(e.buffer,e.byteOffset,i),a=new Int32Array(i);for(let n=0;n<i;n++){let s=r[n];if(s>2147483647n||s<-2147483648n)throw new Error(`Overflow occurred when converting BigInt to Int32 at index ${n}: ${s}`);a[n]=Number(s)}return t?new Uint8Array(a.buffer):a},xi=(e,t=!0)=>{if(e.byteLength%4!==0)throw new Error("Invalid Uint8Array length - must be a multiple of 4 (Int32).");let i=e.byteLength/4,r=new Int32Array(e.buffer,e.byteOffset,i),a=BigInt64Array.from(r,BigInt);return t?new Uint8Array(a.buffer):a},Oa=1,ki=()=>Oa++,Ra=new Map([["float32",32],["float16",16],["int32",32],["uint32",32],["int64",64],["uint64",64],["int8",8],["uint8",8],["int4",4],["uint4",4]]),Ii=(e,t)=>{let i=Ra.get(e);if(!i)throw new Error("Unsupported data type.");return t.length>0?Math.ceil(t.reduce((r,a)=>r*a)*i/8):0},Si=class{constructor(e){this.shouldConvertInt64toInt32=!1,this.isInt64ToInt32Converted=!1;let{sessionId:t,context:i,tensor:r,dataType:a,shape:n,shouldConvertInt64toInt32:s=!1}=e;this.sessionId=t,this.mlContext=i,this.mlTensor=r,this.dataType=a,this.tensorShape=n,this.shouldConvertInt64toInt32=s}get tensor(){return this.mlTensor}get type(){return this.dataType}get shape(){return this.tensorShape}get byteLength(){return Ii(this.dataType,this.tensorShape)}destroy(){F("verbose",()=>"[WebNN] TensorWrapper.destroy"),this.mlTensor.destroy()}write(e){this.mlContext.writeTensor(this.mlTensor,e)}async read(e,t){if(e){let i=await this.mlContext.readTensor(this.mlTensor),r=xi(new Uint8Array(i));if(t){(t instanceof ArrayBuffer?new Uint8Array(t):new Uint8Array(t.buffer,t.byteOffset,t.byteLength)).set(r);return}else return r.buffer}else return t?this.mlContext.readTensor(this.mlTensor,t):this.mlContext.readTensor(this.mlTensor)}canReuseTensor(e,t,i){return this.mlContext===e&&this.dataType===t&&this.tensorShape.length===i.length&&this.tensorShape.every((r,a)=>r===i[a])}setIsInt64ToInt32Converted(e){this.isInt64ToInt32Converted=e}},Ti=class{constructor(e,t){this.tensorManager=e,this.wrapper=t}get tensorWrapper(){return this.wrapper}releaseTensor(){this.tensorWrapper&&(this.tensorManager.releaseTensor(this.tensorWrapper),this.wrapper=void 0)}async ensureTensor(e,t,i,r){let a=t,n=this.tensorManager.getMLContext(e),s=a==="int64"&&!n.opSupportLimits().input.dataTypes.includes("int64");if(s&&(a="int32",F("verbose",()=>"[WebNN] TensorIdTracker.ensureTensor: convert dataType from int64 to int32")),this.wrapper){if(this.wrapper.canReuseTensor(n,a,i))return this.wrapper.tensor;if(r){if(this.wrapper.byteLength!==Ii(a,i))throw new Error("Unable to copy data to tensor with different size.");this.activeUpload=new Uint8Array(await this.wrapper.read())}this.tensorManager.releaseTensor(this.wrapper)}let o=typeof MLTensorUsage>"u"?void 0:MLTensorUsage.READ|MLTensorUsage.WRITE;return this.wrapper=await this.tensorManager.getCachedTensor(e,a,i,o,!0,!0,s),r&&this.activeUpload&&(this.wrapper.write(this.activeUpload),this.activeUpload=void 0),this.wrapper.tensor}upload(e){let t=e;if(this.wrapper)if(this.wrapper.shouldConvertInt64toInt32&&(t=vi(e,!0),this.wrapper.setIsInt64ToInt32Converted(!0)),t.byteLength===this.wrapper.byteLength){this.wrapper.write(t);return}else F("verbose",()=>"Data size does not match tensor size. Releasing tensor."),this.releaseTensor();this.activeUpload?this.activeUpload.set(t):this.activeUpload=new Uint8Array(t)}async download(e){var t,i,r;if(this.activeUpload){let a=(t=this.wrapper)!=null&&t.isInt64ToInt32Converted?xi(this.activeUpload):this.activeUpload;if(e){e instanceof ArrayBuffer?new Uint8Array(e).set(a):new Uint8Array(e.buffer,e.byteOffset,e.byteLength).set(a);return}else return a.buffer}if(!this.wrapper)throw new Error("Tensor has not been created.");return e?this.wrapper.read((i=this.wrapper)==null?void 0:i.shouldConvertInt64toInt32,e):this.wrapper.read((r=this.wrapper)==null?void 0:r.shouldConvertInt64toInt32)}},Da=class{constructor(e){this.backend=e,this.tensorTrackersById=new Map,this.freeTensors=[],this.externalTensors=new Set}getMLContext(e){let t=this.backend.getMLContext(e);if(!t)throw new Error("MLContext not found for session.");return t}reserveTensorId(){let e=ki();return this.tensorTrackersById.set(e,new Ti(this)),e}releaseTensorId(e){let t=this.tensorTrackersById.get(e);t&&(this.tensorTrackersById.delete(e),t.tensorWrapper&&this.releaseTensor(t.tensorWrapper))}async ensureTensor(e,t,i,r,a){F("verbose",()=>`[WebNN] TensorManager.ensureTensor {tensorId: ${t}, dataType: ${i}, shape: ${r}, copyOld: ${a}}`);let n=this.tensorTrackersById.get(t);if(!n)throw new Error("Tensor not found.");return n.ensureTensor(e,i,r,a)}upload(e,t){let i=this.tensorTrackersById.get(e);if(!i)throw new Error("Tensor not found.");i.upload(t)}async download(e,t){F("verbose",()=>`[WebNN] TensorManager.download {tensorId: ${e}, dstBuffer: ${t==null?void 0:t.byteLength}}`);let i=this.tensorTrackersById.get(e);if(!i)throw new Error("Tensor not found.");return i.download(t)}releaseTensorsForSession(e){for(let t of this.freeTensors)t.sessionId===e&&t.destroy();this.freeTensors=this.freeTensors.filter(t=>t.sessionId!==e)}registerTensor(e,t,i,r){let a=this.getMLContext(e),n=ki(),s=new Si({sessionId:e,context:a,tensor:t,dataType:i,shape:r});return this.tensorTrackersById.set(n,new Ti(this,s)),this.externalTensors.add(s),n}async getCachedTensor(e,t,i,r,a,n,s=!1){let o=this.getMLContext(e);for(let[l,d]of this.freeTensors.entries())if(d.canReuseTensor(o,t,i)){F("verbose",()=>`[WebNN] Reusing tensor {dataType: ${t}, shape: ${i}}`);let p=this.freeTensors.splice(l,1)[0];return p.sessionId=e,p}F("verbose",()=>`[WebNN] MLContext.createTensor {dataType: ${t}, shape: ${i}}`);let u=await o.createTensor({dataType:t,shape:i,dimensions:i,usage:r,writable:a,readable:n});return new Si({sessionId:e,context:o,tensor:u,dataType:t,shape:i,shouldConvertInt64toInt32:s})}releaseTensor(e){this.externalTensors.has(e)&&this.externalTensors.delete(e),this.freeTensors.push(e)}},Ma=(...e)=>new Da(...e)}),At,Pa,Ua,vp=E(()=>{V(),Ne(),Aa(),bp(),Ce(),At=new Map([[1,"float32"],[10,"float16"],[6,"int32"],[12,"uint32"],[7,"int64"],[13,"uint64"],[22,"int4"],[21,"uint4"],[3,"int8"],[2,"uint8"],[9,"uint8"]]),Pa=(e,t)=>{if(e===t)return!0;if(e===void 0||t===void 0)return!1;let i=Object.keys(e).sort(),r=Object.keys(t).sort();return i.length===r.length&&i.every((a,n)=>a===r[n]&&e[a]===t[a])},Ua=class{constructor(e){this.tensorManager=Ma(this),this.mlContextBySessionId=new Map,this.sessionIdsByMLContext=new Map,this.mlContextCache=[],this.sessionGraphInputs=new Map,this.temporaryGraphInputs=[],this.temporarySessionTensorIds=new Map,wi(e.logLevel,!!e.debug)}get currentSessionId(){if(this.activeSessionId===void 0)throw new Error("No active session");return this.activeSessionId}onRunStart(e){F("verbose",()=>`[WebNN] onRunStart {sessionId: ${e}}`),this.activeSessionId=e}onRunEnd(e){F("verbose",()=>`[WebNN] onRunEnd {sessionId: ${e}}`);let t=this.temporarySessionTensorIds.get(e);if(t){for(let i of t)F("verbose",()=>`[WebNN] releasing temporary tensor {tensorId: ${i}}`),this.tensorManager.releaseTensorId(i);this.temporarySessionTensorIds.delete(e),this.activeSessionId=void 0}}async createMLContext(e){if(e instanceof GPUDevice){let i=this.mlContextCache.findIndex(r=>r.gpuDevice===e);if(i!==-1)return this.mlContextCache[i].mlContext;{let r=await navigator.ml.createContext(e);return this.mlContextCache.push({gpuDevice:e,mlContext:r}),r}}else if(e===void 0){let i=this.mlContextCache.findIndex(r=>r.options===void 0&&r.gpuDevice===void 0);if(i!==-1)return this.mlContextCache[i].mlContext;{let r=await navigator.ml.createContext();return this.mlContextCache.push({mlContext:r}),r}}let t=this.mlContextCache.findIndex(i=>Pa(i.options,e));if(t!==-1)return this.mlContextCache[t].mlContext;{let i=await navigator.ml.createContext(e);return this.mlContextCache.push({options:e,mlContext:i}),i}}registerMLContext(e,t){this.mlContextBySessionId.set(e,t);let i=this.sessionIdsByMLContext.get(t);i||(i=new Set,this.sessionIdsByMLContext.set(t,i)),i.add(e),this.temporaryGraphInputs.length>0&&(this.sessionGraphInputs.set(e,this.temporaryGraphInputs),this.temporaryGraphInputs=[])}onReleaseSession(e){this.sessionGraphInputs.delete(e);let t=this.mlContextBySessionId.get(e);if(!t)return;this.tensorManager.releaseTensorsForSession(e),this.mlContextBySessionId.delete(e);let i=this.sessionIdsByMLContext.get(t);if(i.delete(e),i.size===0){this.sessionIdsByMLContext.delete(t);let r=this.mlContextCache.findIndex(a=>a.mlContext===t);r!==-1&&this.mlContextCache.splice(r,1)}}getMLContext(e){return this.mlContextBySessionId.get(e)}reserveTensorId(){return this.tensorManager.reserveTensorId()}releaseTensorId(e){F("verbose",()=>`[WebNN] releaseTensorId {tensorId: ${e}}`),this.tensorManager.releaseTensorId(e)}async ensureTensor(e,t,i,r,a){let n=At.get(i);if(!n)throw new Error(`Unsupported ONNX data type: ${i}`);return this.tensorManager.ensureTensor(e??this.currentSessionId,t,n,r,a)}async createTemporaryTensor(e,t,i){F("verbose",()=>`[WebNN] createTemporaryTensor {onnxDataType: ${t}, shape: ${i}}`);let r=At.get(t);if(!r)throw new Error(`Unsupported ONNX data type: ${t}`);let a=this.tensorManager.reserveTensorId();await this.tensorManager.ensureTensor(e,a,r,i,!1);let n=this.temporarySessionTensorIds.get(e);return n?n.push(a):this.temporarySessionTensorIds.set(e,[a]),a}uploadTensor(e,t){if(!ee().shouldTransferToMLTensor)throw new Error("Trying to upload to a MLTensor while shouldTransferToMLTensor is false");F("verbose",()=>`[WebNN] uploadTensor {tensorId: ${e}, data: ${t.byteLength}}`),this.tensorManager.upload(e,t)}async downloadTensor(e,t){return this.tensorManager.download(e,t)}createMLTensorDownloader(e,t){return async()=>{let i=await this.tensorManager.download(e);return bi(i,t)}}registerMLTensor(e,t,i,r){let a=At.get(i);if(!a)throw new Error(`Unsupported ONNX data type: ${i}`);let n=this.tensorManager.registerTensor(e,t,a,r);return F("verbose",()=>`[WebNN] registerMLTensor {tensor: ${t}, dataType: ${a}, dimensions: ${r}} -> {tensorId: ${n}}`),n}registerMLConstant(e,t,i,r,a,n,s=!1){if(!n)throw new Error("External mounted files are not available.");let o=e;e.startsWith("./")&&(o=e.substring(2));let u=n.get(o);if(!u)throw new Error(`File with name ${o} not found in preloaded files.`);if(t+i>u.byteLength)throw new Error("Out of bounds: data offset and length exceed the external file data size.");let l=u.slice(t,t+i).buffer,d;switch(a.dataType){case"float32":d=new Float32Array(l);break;case"float16":d=typeof Float16Array<"u"&&Float16Array.from?new Float16Array(l):new Uint16Array(l);break;case"int32":d=new Int32Array(l);break;case"uint32":d=new Uint32Array(l);break;case"int64":s?(d=vi(new Uint8Array(l),!1),a.dataType="int32"):d=new BigInt64Array(l);break;case"uint64":d=new BigUint64Array(l);break;case"int8":d=new Int8Array(l);break;case"int4":case"uint4":case"uint8":d=new Uint8Array(l);break;default:throw new Error(`Unsupported data type: ${a.dataType} in creating WebNN Constant from external data.`)}return F("verbose",()=>`[WebNN] registerMLConstant {dataType: ${a.dataType}, shape: ${a.shape}}} ${s?"(Note: it was int64 data type and registered to int32 as workaround)":""}`),r.constant(a,d)}registerGraphInput(e){this.temporaryGraphInputs.push(e)}isGraphInput(e,t){let i=this.sessionGraphInputs.get(e);return i?i.includes(t):!1}isInt64Supported(e){var t;return!!((t=this.mlContextBySessionId.get(e))!=null&&t.opSupportLimits().input.dataTypes.includes("int64"))}flush(){}}}),zi=E(()=>{}),Ei,Ot,Rt,qa,Na,Ci,Bi,Va,La,xp=E(()=>{Ce(),zi(),Ei=new Map([[64,250],[128,200],[256,200],[512,200],[2048,230],[4096,200],[8192,50],[16384,50],[32768,50],[65536,50],[131072,50],[262144,50],[524288,50],[1048576,50],[2097152,30],[4194304,20],[8388608,10],[12582912,10],[16777216,10],[26214400,15],[33554432,22],[44236800,2],[58982400,6],[67108864,6],[134217728,6],[167772160,6]]),Ot=[],Rt=e=>Math.ceil(Number(e)/16)*16,qa=e=>{for(let t=0;t<Ot.length;t++){let i=Ot[t];if(e<=i)return i}return Math.ceil(e/16)*16},Na=1,Ci=()=>Na++,Bi=async(e,t,i,r)=>{let a=Rt(i),n=e.device.createBuffer({size:a,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});try{let s=e.getCommandEncoder();e.endComputePass(),s.copyBufferToBuffer(t,0,n,0,a),e.flush(),await n.mapAsync(GPUMapMode.READ);let o=n.getMappedRange();if(r){let u=r();return u.set(new Uint8Array(o,0,i)),u}else return new Uint8Array(o.slice(0,i))}finally{n.destroy()}},Va=class{constructor(e){this.backend=e,this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.buffersPending=[],this.capturedPendingBuffers=new Map;for(let[t]of Ei)Ot.push(t),this.freeBuffers.set(t,[]),this.freeUniformBuffers.set(t,[]);this.sessionCount=0}upload(e,t){let i=t.buffer,r=t.byteOffset,a=t.byteLength,n=Rt(a),s=this.storageCache.get(e);if(!s)throw new Error("gpu data for uploading does not exist");if(Number(s.originalSize)!==a)throw new Error(`inconsistent data size. gpu data size=${s.originalSize}, data size=${a}`);let o=this.backend.device.createBuffer({mappedAtCreation:!0,size:n,usage:GPUBufferUsage.MAP_WRITE|GPUBufferUsage.COPY_SRC}),u=o.getMappedRange();new Uint8Array(u).set(new Uint8Array(i,r,a)),o.unmap();let l=this.backend.device.createCommandEncoder();l.copyBufferToBuffer(o,0,s.gpuData.buffer,0,n),this.backend.device.queue.submit([l.finish()]),o.destroy(),F("verbose",()=>`[WebGPU] GpuDataManager.upload(id=${e})`)}memcpy(e,t){let i=this.storageCache.get(e);if(!i)throw new Error("source gpu data for memcpy does not exist");let r=this.storageCache.get(t);if(!r)throw new Error("destination gpu data for memcpy does not exist");if(i.originalSize!==r.originalSize)throw new Error("inconsistent source and destination gpu data size");let a=Rt(i.originalSize),n=this.backend.getCommandEncoder();this.backend.endComputePass(),n.copyBufferToBuffer(i.gpuData.buffer,0,r.gpuData.buffer,0,a)}registerExternalBuffer(e,t,i){let r;if(i){if(r=i[0],e===i[1])return F("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${r}, buffer is the same, skip.`),r;if(this.backend.capturedCommandList.has(this.backend.currentSessionId))throw new Error(`Registering a different external buffer under graph capture mode is not supported yet.
             Please use the previous external buffer!`)}else r=Ci();return this.storageCache.set(r,{gpuData:{id:r,type:0,buffer:e},originalSize:t}),F("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${r}, registered.`),r}unregisterExternalBuffer(e){e!==void 0&&(this.storageCache.delete(e),F("verbose",()=>`[WebGPU] GpuDataManager.unregisterExternalBuffer() => id=${e}`))}create(e,t=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST){let i=qa(e),r,a=(t&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE,n=(t&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM;if(a||n){let o=(a?this.freeBuffers:this.freeUniformBuffers).get(i);o?o.length>0?r=o.pop():r=this.backend.device.createBuffer({size:i,usage:t}):r=this.backend.device.createBuffer({size:i,usage:t})}else r=this.backend.device.createBuffer({size:i,usage:t});let s={id:Ci(),type:0,buffer:r};return this.storageCache.set(s.id,{gpuData:s,originalSize:Number(e)}),F("verbose",()=>`[WebGPU] GpuDataManager.create(size=${e}) => id=${s.id}`),s}get(e){var t;return(t=this.storageCache.get(e))==null?void 0:t.gpuData}release(e){let t=typeof e=="bigint"?Number(e):e,i=this.storageCache.get(t);if(!i){if(this.storageCache.size===0)return 0;throw new Error("releasing data does not exist")}return F("verbose",()=>`[WebGPU] GpuDataManager.release(id=${t}), gpuDataId=${i.gpuData.id}`),this.storageCache.delete(t),this.buffersPending.push(i.gpuData.buffer),i.originalSize}async download(e,t){let i=this.storageCache.get(Number(e));if(!i)throw new Error("data does not exist");await Bi(this.backend,i.gpuData.buffer,i.originalSize,t)}refreshPendingBuffers(){if(this.buffersPending.length!==0)if(this.backend.sessionStatus==="default"){for(let e of this.buffersPending){let t=Ei.get(e.size);if((e.usage&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE){let i=this.freeBuffers.get(e.size)||[];t===void 0||i.length>=t?e.destroy():i.push(e)}else if((e.usage&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM){let i=this.freeUniformBuffers.get(e.size)||[];t===void 0||i.length>=t?e.destroy():i.push(e)}else e.destroy()}this.buffersPending=[]}else{let e=this.capturedPendingBuffers.get(this.backend.currentSessionId);e||(e=[],this.capturedPendingBuffers.set(this.backend.currentSessionId,e));for(let t of this.buffersPending)e.push(t);this.buffersPending=[]}}dispose(){this.freeBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.freeUniformBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache.forEach(e=>{e.gpuData.buffer.destroy()}),this.capturedPendingBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.capturedPendingBuffers=new Map}onCreateSession(){this.sessionCount+=1}onReleaseSession(e){let t=this.capturedPendingBuffers.get(e);t&&(t.forEach(i=>{i.destroy()}),this.capturedPendingBuffers.delete(e)),this.sessionCount-=1,this.sessionCount===0&&(F("warning",()=>"[WebGPU] Clearing webgpu buffer cache"),this.storageCache.forEach(i=>{i.gpuData.buffer.destroy()}),this.storageCache=new Map)}},La=(...e)=>new Va(...e)}),Wa,Q,re=E(()=>{Wa=class{constructor(e){Object.assign(this,e)}get cacheKey(){return this.key||(this.key=Object.getOwnPropertyNames(this).sort().map(e=>`${this[e]}`).join(";")),this.key}},Q=e=>new Wa(e)}),it,Dt,ae,oe,M,ie,Ai,rt,Oe,R,ft,S,O,Ga,Oi,Ha,Fa,W=E(()=>{V(),L(),it=64,Dt=(e,t)=>{if(t===3)throw new Error("vec3 has same alignment as vec4, use vec4 instead");switch(Number(e)){case 10:return t>1?`vec${t}<f16>`:"f16";case 1:return t>1?`vec${t}<f32>`:"f32";case 6:return t>1?`vec${t}<i32>`:"i32";case 12:return t>1?`vec${t}<u32>`:"u32";case 7:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","i32"];case 13:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","u32"];case 9:if(t!==4)throw new Error("bool must be vec4");return["u32","vec4<bool>"];case 22:return"i32";case 21:return"u32";default:throw new Error(`Unknown data type: ${e}`)}},ae=(e,t=1)=>{let i=Dt(e,t);return typeof i=="string"?i:i[0]},oe=(e,t=1)=>{let i=Dt(e,t);return typeof i=="string"?i:i[1]},M=(...e)=>{let t=[];return e.forEach(i=>{i.length!==0&&t.push({type:12,data:i},{type:12,data:k.computeStrides(i)})}),t},ie=e=>e%4===0?4:e%2===0?2:1,Ai=(e="f32",t,i="0")=>!t||t===1?`${e}(${i})`:`vec${t}<${e}>(${i})`,rt=(e,t,i)=>e==="f32"?i:t===1?`f32(${i})`:`vec${t}<f32>(${i})`,Oe=(e,t)=>t===4?`(${e}.x + ${e}.y + ${e}.z + ${e}.w)`:t===2?`(${e}.x + ${e}.y)`:t===3?`(${e}.x + ${e}.y + ${e}.z)`:e,R=(e,t,i,r)=>e.startsWith("uniforms.")&&i>4?typeof t=="string"?r==="f16"?`${e}[(${t}) / 8][(${t}) % 8 / 4][(${t}) % 8 % 4]`:`${e}[(${t}) / 4][(${t}) % 4]`:r==="f16"?`${e}[${Math.floor(t/8)}][${Math.floor(t%8/4)}][${t%8%4}]`:`${e}[${Math.floor(t/4)}][${t%4}]`:i>1?`${e}[${t}]`:e,ft=(e,t,i,r,a)=>{let n=typeof i=="number",s=n?i:i.length,o=[...new Array(s).keys()],u=s<2?"u32":s<=4?`vec${s}<u32>`:`array<u32, ${s}>`,l=Dt(t,a),d=typeof l=="string"?l:l[1],p=typeof l=="string"?l:l[0],h={indices:u,value:d,storage:p,tensor:t},c=z=>typeof z=="string"?z:`${z}u`,f={offsetToIndices:!1,indicesToOffset:!1,broadcastedIndicesToOffset:!1,set:!1,setByIndices:!1,get:!1,getByIndices:!1},m=n?"uniforms.":"",y=`${m}${e}_shape`,_=`${m}${e}_strides`,g="";for(let z=0;z<s-1;z++)g+=`
    let dim${z} = current / ${R(_,z,s)};
    let rest${z} = current % ${R(_,z,s)};
    indices[${z}] = dim${z};
    current = rest${z};
    `;g+=`indices[${s-1}] = current;`;let w=s<2?"":`
  fn o2i_${e}(offset: u32) -> ${h.indices} {
    var indices: ${h.indices};
    var current = offset;
    ${g}
    return indices;
  }`,$=z=>(f.offsetToIndices=!0,s<2?z:`o2i_${e}(${z})`),b=[];if(s>=2)for(let z=s-1;z>=0;z--)b.push(`${R(_,z,s)} * (indices[${z}])`);let x=s<2?"":`
  fn i2o_${e}(indices: ${h.indices}) -> u32 {
    return ${b.join("+")};
  }`,v=z=>(f.indicesToOffset=!0,s<2?z:`i2o_${e}(${z})`),I=(...z)=>s===0?"0u":`${h.indices}(${z.map(c).join(",")})`,T=(z,B)=>s<2?`${z}`:`${R(z,B,s)}`,C=(z,B,N)=>s<2?`${z}=${N};`:`${R(z,B,s)}=${N};`,q={},D=(z,B)=>{f.broadcastedIndicesToOffset=!0;let N=`${B.name}broadcastedIndicesTo${e}Offset`;if(N in q)return`${N}(${z})`;let X=[];for(let pe=s-1;pe>=0;pe--){let Kt=B.indicesGet("outputIndices",pe+B.rank-s);X.push(`${T(_,pe)} * (${Kt} % ${T(y,pe)})`)}return q[N]=`fn ${N}(outputIndices: ${B.type.indices}) -> u32 {
             return ${X.length>0?X.join("+"):"0u"};
           }`,`${N}(${z})`},P=(z,B)=>(()=>{if(h.storage===h.value)return`${e}[${z}]=${B};`;if(h.storage==="vec2<u32>"&&h.value==="i32")return`${e}[${z}]=vec2<u32>(u32(${B}), select(0u, 0xFFFFFFFFu, ${B} < 0));`;if(h.storage==="vec2<u32>"&&h.value==="u32")return`${e}[${z}]=vec2<u32>(u32(${B}), 0u);`;if(h.storage==="u32"&&h.value==="vec4<bool>")return`${e}[${z}]=dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(${B}));`;throw new Error(`not supported combination of storage type ${h.storage} and value type ${h.value} yet`)})(),Z=z=>(()=>{if(h.storage===h.value)return`${e}[${z}]`;if(h.storage==="vec2<u32>"&&h.value==="i32")return`i32(${e}[${z}].x)`;if(h.storage==="vec2<u32>"&&h.value==="u32")return`u32(${e}[${z}].x)`;if(h.storage==="u32"&&h.value==="vec4<bool>")return`vec4<bool>(bool(${e}[${z}] & 0xFFu), bool(${e}[${z}] & 0xFF00u), bool(${e}[${z}] & 0xFF0000u), bool(${e}[${z}] & 0xFF000000u))`;throw new Error(`not supported combination of storage type ${h.storage} and value type ${h.value} yet`)})(),H=s<2?"":`
  fn get_${e}ByIndices(indices: ${h.indices}) -> ${d} {
    return ${Z(`i2o_${e}(indices)`)};
  }`,U=s<2?"":(()=>{let z=o.map(N=>`d${N}: u32`).join(", "),B=o.map(N=>`d${N}`).join(", ");return`
  fn get_${e}(${z}) -> ${d} {
    return get_${e}ByIndices(${I(B)});
  }`})(),A=(...z)=>{if(z.length!==s)throw new Error(`indices length must be ${s}`);let B=z.map(c).join(",");return s===0?Z("0u"):s===1?Z(B[0]):(f.get=!0,f.getByIndices=!0,f.indicesToOffset=!0,`get_${e}(${B})`)},J=z=>s<2?Z(z):(f.getByIndices=!0,f.indicesToOffset=!0,`get_${e}ByIndices(${z})`),G=s<2?"":`
  fn set_${e}ByIndices(indices: ${h.indices}, value: ${d}) {
    ${P(`i2o_${e}(indices)`,"value")}
  }`,j=s<2?"":(()=>{let z=o.map(N=>`d${N}: u32`).join(", "),B=o.map(N=>`d${N}`).join(", ");return`
  fn set_${e}(${z}, value: ${d}) {
    set_${e}ByIndices(${I(B)}, value);
  }`})();return{impl:()=>{let z=[],B=!1;return f.offsetToIndices&&(z.push(w),B=!0),f.indicesToOffset&&(z.push(x),B=!0),f.broadcastedIndicesToOffset&&(Object.values(q).forEach(N=>z.push(N)),B=!0),f.set&&(z.push(j),B=!0),f.setByIndices&&(z.push(G),B=!0),f.get&&(z.push(U),B=!0),f.getByIndices&&(z.push(H),B=!0),!n&&B&&z.unshift(`const ${y} = ${h.indices}(${i.join(",")});`,`const ${_} = ${h.indices}(${k.computeStrides(i).join(",")});`),z.join(`
`)},type:h,offsetToIndices:$,indicesToOffset:v,broadcastedIndicesToOffset:D,indices:I,indicesGet:T,indicesSet:C,set:(...z)=>{if(z.length!==s+1)throw new Error(`indices length must be ${s}`);let B=z[s];if(typeof B!="string")throw new Error("value must be string");let N=z.slice(0,s).map(c).join(",");return s===0?P("0u",B):s===1?P(N[0],B):(f.set=!0,f.setByIndices=!0,f.indicesToOffset=!0,`set_${e}(${N}, ${B})`)},setByOffset:P,setByIndices:(z,B)=>s<2?P(z,B):(f.setByIndices=!0,f.indicesToOffset=!0,`set_${e}ByIndices(${z}, ${B});`),get:A,getByOffset:Z,getByIndices:J,usage:r,name:e,strides:_,shape:y,rank:s}},S=(e,t,i,r=1)=>ft(e,t,i,"input",r),O=(e,t,i,r=1)=>ft(e,t,i,"output",r),Ga=(e,t,i)=>ft(e,t,i,"atomicOutput",1),Oi=(e,t,i,r=1)=>ft(e,t,i,"internal",r),Ha=class{constructor(e,t){this.normalizedDispatchGroup=e,this.limits=t,this.internalVariables=[],this.variables=[],this.uniforms=[],this.variableIndex=0}guardAgainstOutOfBoundsWorkgroupSizes(e){return`if (global_idx >= ${typeof e=="number"?`${e}u`:e}) { return; }`}mainStart(e=it){let t=typeof e=="number"?e:e[0],i=typeof e=="number"?1:e[1],r=typeof e=="number"?1:e[2];if(t>this.limits.maxComputeWorkgroupSizeX||i>this.limits.maxComputeWorkgroupSizeY||r>this.limits.maxComputeWorkgroupSizeZ)throw new Error(`workgroup size [${t}, ${i}, ${r}] exceeds the maximum workgroup size [${this.limits.maxComputeWorkgroupSizeX}, ${this.limits.maxComputeWorkgroupSizeY}, ${this.limits.maxComputeWorkgroupSizeZ}].`);if(t*i*r>this.limits.maxComputeInvocationsPerWorkgroup)throw new Error(`workgroup size [${t}, ${i}, ${r}] exceeds the maximum workgroup invocations ${this.limits.maxComputeInvocationsPerWorkgroup}.`);let a=this.normalizedDispatchGroup[1]===1&&this.normalizedDispatchGroup[2]===1,n=a?`@builtin(global_invocation_id) global_id : vec3<u32>,
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(local_invocation_index) local_idx : u32,
    @builtin(local_invocation_id) local_id : vec3<u32>`:`@builtin(global_invocation_id) global_id : vec3<u32>,
                                             @builtin(local_invocation_id) local_id : vec3<u32>,
    @builtin(local_invocation_index) local_idx : u32,
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(num_workgroups) num_workgroups : vec3<u32>`,s=a?`let global_idx = global_id.x;
         let workgroup_index = workgroup_id.x;`:`let workgroup_index = workgroup_id.z * num_workgroups[0] * num_workgroups[1] +
             workgroup_id.y * num_workgroups[0] + workgroup_id.x;
         let global_idx = workgroup_index * ${t*i*r}u + local_idx;`;return`@compute @workgroup_size(${t}, ${i}, ${r})
  fn main(${n}) {
    ${s}
  `}appendVariableUniforms(e){e.rank!==0&&(e.shape.startsWith("uniforms.")&&this.uniforms.push({name:e.shape.replace("uniforms.",""),type:"u32",length:e.rank}),e.strides.startsWith("uniforms.")&&this.uniforms.push({name:e.strides.replace("uniforms.",""),type:"u32",length:e.rank}))}declareVariable(e,t){if(e.usage==="internal")throw new Error("cannot use internal variable with declareVariable(). use registerInternalVariables() instead.");this.variables.push(e),this.appendVariableUniforms(e);let i=e.usage==="input"?"read":"read_write",r=e.usage==="atomicOutput"?"atomic<i32>":e.type.storage;return`@group(0) @binding(${t}) var<storage, ${i}> ${e.name}: array<${r}>;`}declareVariables(...e){return e.map(t=>this.declareVariable(t,this.variableIndex++)).join(`
`)}registerInternalVariable(e){if(e.usage!=="internal")throw new Error("cannot use input or output variable with registerInternalVariable(). use declareVariables() instead.");this.internalVariables.push(e),this.appendVariableUniforms(e)}registerInternalVariables(...e){return e.forEach(t=>this.registerInternalVariable(t)),this}registerUniform(e,t,i=1){return this.uniforms.push({name:e,type:t,length:i}),this}registerUniforms(e){return this.uniforms=this.uniforms.concat(e),this}uniformDeclaration(){if(this.uniforms.length===0)return"";let e=[];for(let{name:t,type:i,length:r}of this.uniforms)if(r&&r>4)i==="f16"?e.push(`@align(16) ${t}:array<mat2x4<${i}>, ${Math.ceil(r/8)}>`):e.push(`${t}:array<vec4<${i}>, ${Math.ceil(r/4)}>`);else{let a=r==null||r===1?i:`vec${r}<${i}>`;e.push(`${t}:${a}`)}return`
      struct Uniforms { ${e.join(", ")} };
      @group(0) @binding(${this.variableIndex}) var<uniform> uniforms: Uniforms;`}get additionalImplementations(){return this.uniformDeclaration()+this.variables.map(e=>e.impl()).join(`
`)+this.internalVariables.map(e=>e.impl()).join(`
`)}get variablesInfo(){if(this.uniforms.length===0)return;let e=t=>[12,10,1,6][["u32","f16","f32","i32"].indexOf(t)];return this.uniforms.map(t=>[e(t.type),t.length??1])}},Fa=(e,t)=>new Ha(e,t)}),ja,Ri,Ka,Za,Qa,Xa,me,Ya,Ja,Re=E(()=>{V(),L(),re(),W(),ja=(e,t)=>{if(!e||e.length!==1)throw new Error("Transpose requires 1 input.");if(t.length!==0&&t.length!==e[0].dims.length)throw new Error(`perm size ${t.length} does not match input rank ${e[0].dims.length}`)},Ri=(e,t)=>t.length!==0?t:[...new Array(e).keys()].reverse(),Ka=(e,t)=>k.sortBasedOnPerm(e,Ri(e.length,t)),Za=(e,t,i,r)=>{let a=`fn perm(i: ${r.type.indices}) -> ${i.type.indices} {
    var a: ${i.type.indices};`;for(let n=0;n<t;++n)a+=`a[${e[n]}]=i[${n}];`;return a+="return a;}"},Qa=(e,t)=>{let i=[],r=[];for(let a=0;a<e.length;++a)e[a]!==1&&i.push(e[a]),e[t[a]]!==1&&r.push(t[a]);return{newShape:i,newPerm:r}},Xa=(e,t)=>{let i=0;for(let r=0;r<e.length;++r)if(t[e[r]]!==1){if(e[r]<i)return!1;i=e[r]}return!0},me=(e,t)=>{let i=e.dataType,r=e.dims.length,a=Ri(r,t),n=Ka(e.dims,a),s=e.dims,o=n,u=r<2||Xa(a,e.dims),l;if(u)return l=f=>{let m=S("input",i,s,4),y=O("output",i,o,4);return`
  ${f.registerUniform("output_size","u32").declareVariables(m,y)}
  ${f.mainStart()}
    ${f.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    output[global_idx] = input[global_idx];
  }`},{name:"TransposeCopy",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let f=k.size(n);return{outputs:[{dims:n,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(f/64/4)},programUniforms:[{type:12,data:Math.ceil(f/4)}]}},getShaderSource:l};let{newShape:d,newPerm:p}=Qa(e.dims,a),h=k.areEqual(p,[2,3,1]),c=k.areEqual(p,[3,1,2]);if(d.length===2||h||c){s=h?[d[0],d[1]*d[2]]:c?[d[0]*d[1],d[2]]:d,o=[s[1],s[0]];let f=16;return l=m=>{let y=S("a",i,s.length),_=O("output",i,o.length);return`
  ${m.registerUniform("output_size","u32").declareVariables(y,_)}
  var<workgroup> tile : array<array<${_.type.value}, ${f+1}>, ${f}>;
  ${m.mainStart([f,f,1])}
    let stride = (uniforms.output_shape[1] - 1) / ${f} + 1;
    let workgroup_id_x = workgroup_index % stride;
    let workgroup_id_y = workgroup_index / stride;
    let input_col = workgroup_id_y * ${f}u + local_id.x;
    let input_row = workgroup_id_x * ${f}u + local_id.y;
    if (input_row < uniforms.a_shape[0] && input_col < uniforms.a_shape[1]) {
      tile[local_id.y][local_id.x] = ${y.getByIndices(`${y.type.indices}(input_row, input_col)`)};
    }
    workgroupBarrier();

    let output_col = workgroup_id_x * ${f}u + local_id.x;
    let output_row = workgroup_id_y * ${f}u + local_id.y;
    if (output_row < uniforms.output_shape[0] && output_col < uniforms.output_shape[1]) {
      ${_.setByIndices(`${_.type.indices}(output_row, output_col)`,"tile[local_id.x][local_id.y]")}
    }
  }`},{name:"TransposeShared",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let m=k.size(n);return{outputs:[{dims:n,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(o[1]/f),y:Math.ceil(o[0]/f)},programUniforms:[{type:12,data:m},...M(s,o)]}},getShaderSource:l}}return l=f=>{let m=S("a",i,s.length),y=O("output",i,o.length);return`
  ${f.registerUniform("output_size","u32").declareVariables(m,y)}

  ${Za(a,r,m,y)}

  ${f.mainStart()}
    ${f.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${y.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${y.setByOffset("global_idx",m.getByIndices("aIndices"))}
  }`},{name:"Transpose",shaderCache:{hint:`${t}`,inputDependencies:["rank"]},getRunData:()=>{let f=k.size(n);return{outputs:[{dims:n,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:[{type:12,data:f},...M(s,o)]}},getShaderSource:l}},Ya=(e,t)=>{ja(e.inputs,t.perm),e.compute(me(e.inputs[0],t.perm))},Ja=e=>Q({perm:e.perm})}),en,tn,rn,an,nn,sn,on,un,ln,dn,ve,pn,hn,cn,fn,mn,gn,_n,yn,$n,wn,kp=E(()=>{V(),L(),W(),Mi(),Re(),en={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate * candidate",logSumExp:"bestValue + exp(candidate)",l1:"bestValue + abs(candidate)",l2:"bestValue + candidate * candidate",logSum:"bestValue + candidate"},tn={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate",logSumExp:"bestValue + candidate",l1:"bestValue + candidate",l2:"bestValue + candidate",logSum:"bestValue + candidate"},rn={max:"_A[offset]",min:"_A[offset]",mean:"0",sum:"0",prod:"1",sumSquare:"0",logSumExp:"0",l1:"0",l2:"0",logSum:"0"},an={max:"bestValue",min:"bestValue",sum:"bestValue",prod:"bestValue",sumSquare:"bestValue",logSumExp:"log(bestValue)",l1:"bestValue",l2:"sqrt(bestValue)",logSum:"log(bestValue)"},nn=(e,t)=>{let i=[];for(let r=t-e;r<t;++r)i.push(r);return i},sn=(e,t)=>{let i=[],r=e.length;for(let n=0;n<r;n++)t.indexOf(n)===-1&&i.push(e[n]);let a=t.map(n=>e[n]);return[i,a]},on=(e,t)=>{let i=e.length+t.length,r=[],a=0;for(let n=0;n<i;n++)t.indexOf(n)===-1?r.push(e[a++]):r.push(1);return r},un=(e,t)=>{for(let i=0;i<e.length;++i)if(e[e.length-i-1]!==t-1-i)return!1;return!0},ln=(e,t)=>{let i=[];if(!un(e,t)){for(let r=0;r<t;++r)e.indexOf(r)===-1&&i.push(r);e.forEach(r=>i.push(r))}return i},dn=(e,t,i,r,a,n,s)=>{let o=i[0].dims,u=k.size(n),l=k.size(s),d=S("_A",i[0].dataType,o),p=O("output",a,n),h=64;u===1&&(h=256);let c=`
          var<workgroup> aBestValues : array<f32, ${h}>;
       `,f=m=>`
        ${m.registerUniform("reduceSize","u32").declareVariables(d,p)}
        ${c}
        fn DIV_CEIL(a : u32, b : u32) -> u32 {
          return ((a - 1u) / b + 1u);
         }
         ${m.mainStart(h)}

          let outputIndex = global_idx / ${h};
          let offset = outputIndex * uniforms.reduceSize;

          var bestValue = f32(${rn[r]});
          let Length = uniforms.reduceSize;
          for (var k = local_idx; k < Length; k = k + ${h}) {
           let candidate = f32(${d.getByOffset("offset + k")});
           bestValue = ${en[r]};
          }
          aBestValues[local_idx] = bestValue;
          workgroupBarrier();

         var reduceSize = min(Length, ${h}u);
         for (var currentSize = reduceSize / 2u; reduceSize > 1u;
             currentSize = reduceSize / 2u) {
           let interval = DIV_CEIL(reduceSize, 2u);
           if (local_idx < currentSize) {
            let candidate = aBestValues[local_idx + interval];
            bestValue = ${tn[r]};
            aBestValues[local_idx] = bestValue;
           }
           reduceSize = interval;
           workgroupBarrier();
         }

         if (local_idx == 0u) {
          ${p.setByOffset("outputIndex",`${r==="mean"?`${p.type.storage}(bestValue / f32(uniforms.reduceSize))`:`${p.type.storage}(${an[r]})`}`)};
         }
        }`;return{name:e,shaderCache:{hint:`${t};${h}`,inputDependencies:["type"]},getShaderSource:f,getRunData:()=>({outputs:[{dims:n,dataType:a}],dispatchGroup:{x:u},programUniforms:[{type:12,data:l}]})}},ve=(e,t,i,r)=>{let a=e.inputs.length===1?i:Di(e.inputs,i),n=a.axes;n.length===0&&!a.noopWithEmptyAxes&&(n=e.inputs[0].dims.map((c,f)=>f));let s=k.normalizeAxes(n,e.inputs[0].dims.length),o=s,u=e.inputs[0],l=ln(o,e.inputs[0].dims.length);l.length>0&&(u=e.compute(me(e.inputs[0],l),{inputs:[0],outputs:[-1]})[0],o=nn(o.length,u.dims.length));let[d,p]=sn(u.dims,o),h=d;a.keepDims&&(h=on(d,s)),e.compute(dn(t,a.cacheKey,[u],r,e.inputs[0].dataType,h,p),{inputs:[u]})},pn=(e,t)=>{ve(e,"ReduceMeanShared",t,"mean")},hn=(e,t)=>{ve(e,"ReduceL1Shared",t,"l1")},cn=(e,t)=>{ve(e,"ReduceL2Shared",t,"l2")},fn=(e,t)=>{ve(e,"ReduceLogSumExpShared",t,"logSumExp")},mn=(e,t)=>{ve(e,"ReduceMaxShared",t,"max")},gn=(e,t)=>{ve(e,"ReduceMinShared",t,"min")},_n=(e,t)=>{ve(e,"ReduceProdShared",t,"prod")},yn=(e,t)=>{ve(e,"ReduceSumShared",t,"sum")},$n=(e,t)=>{ve(e,"ReduceSumSquareShared",t,"sumSquare")},wn=(e,t)=>{ve(e,"ReduceLogSumShared",t,"logSum")}}),xe,bn,Mt,Di,ke,vn,xn,kn,In,Sn,Tn,zn,En,Cn,Bn,Ie,An,On,Rn,Dn,Mn,Pn,Un,qn,Nn,Vn,Mi=E(()=>{V(),L(),re(),W(),kp(),xe=e=>{if(!e||e.length===0||e.length>2)throw new Error("Reduce op requires 1 or 2 inputs.");if(e.length===2&&e[1].dims.length!==1)throw new Error("Invalid axes input dims.")},bn=e=>["","",`var value = ${e.getByIndices("input_indices")};`,""],Mt=(e,t,i,r,a,n,s=!1,o=!1)=>{let u=[],l=i[0].dims,d=l.length,p=k.normalizeAxes(a,d),h=!o&&p.length===0;l.forEach((m,y)=>{h||p.indexOf(y)>=0?s&&u.push(1):u.push(m)});let c=u.length,f=k.size(u);return{name:e,shaderCache:t,getShaderSource:m=>{let y=[],_=S("_A",i[0].dataType,d),g=O("output",n,c),w=r(_,g,p),$=w[2];for(let b=0,x=0;b<d;b++)h||p.indexOf(b)>=0?(s&&x++,$=`for(var j${b}: u32 = 0; j${b} < ${l[b]}; j${b}++) {
                  ${w[2].includes("last_index")?`let last_index = j${b};`:""}
                  ${_.indicesSet("input_indices",b,`j${b}`)}
                  ${$}
                }`):(y.push(`${_.indicesSet("input_indices",b,g.indicesGet("output_indices",x))};`),x++);return`

        ${m.registerUniform("output_size","u32").declareVariables(_,g)}

        ${m.mainStart()}
          ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          var input_indices: ${_.type.indices};
          let output_indices = ${g.offsetToIndices("global_idx")};

          ${y.join(`
`)}
          ${w[0]}       // init ops for reduce max/min
          ${w[1]}
          ${$}
          ${w[3]}
          ${w.length===4?g.setByOffset("global_idx","value"):w.slice(4).join(`
`)}
        }`},getRunData:()=>({outputs:[{dims:u,dataType:n}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:[{type:12,data:f},...M(l,u)]})}},Di=(e,t)=>{let i=[];return e[1].dims[0]>0&&e[1].getBigInt64Array().forEach(r=>i.push(Number(r))),Q({axes:i,keepDims:t.keepDims,noopWithEmptyAxes:t.noopWithEmptyAxes})},ke=(e,t,i,r)=>{let a=e.inputs,n=a.length===1?i:Di(a,i);e.compute(Mt(t,{hint:n.cacheKey,inputDependencies:["rank"]},[a[0]],n.noopWithEmptyAxes&&n.axes.length===0?bn:r,n.axes,a[0].dataType,n.keepDims,n.noopWithEmptyAxes),{inputs:[0]})},vn=(e,t)=>{xe(e.inputs),ke(e,"ReduceLogSum",t,(i,r)=>[`var value = ${r.type.storage}(0);`,"",`value += ${i.getByIndices("input_indices")};`,"value = log(value);"])},xn=(e,t)=>{xe(e.inputs),ke(e,"ReduceL1",t,(i,r)=>[`var value = ${r.type.storage}(0);`,"",`value += abs(${i.getByIndices("input_indices")});`,""])},kn=(e,t)=>{xe(e.inputs),ke(e,"ReduceL2",t,(i,r)=>[`var t = ${r.type.value}(0); var value = ${r.type.value}(0);`,"",`t = ${i.getByIndices("input_indices")}; value += (t * t);`,"value = sqrt(value);"])},In=(e,t)=>{xe(e.inputs),ke(e,"ReduceLogSumExp",t,(i,r)=>[`var value = ${r.type.storage}(0);`,"",`value += exp(${i.getByIndices("input_indices")});`,"value = log(value);"])},Sn=(e,t)=>{xe(e.inputs),ke(e,"ReduceMax",t,(i,r,a)=>{let n=[];for(let s=0;s<i.rank;s++)(a.indexOf(s)>=0||a.length===0)&&n.push(i.indicesSet("input_indices",s,0));return[`${n.join(`
`)}`,`var value = ${i.getByIndices("input_indices")};`,`value = max(value, ${i.getByIndices("input_indices")});`,""]})},Tn=(e,t)=>{xe(e.inputs),ke(e,"ReduceMean",t,(i,r,a)=>{let n=1;for(let s=0;s<i.rank;s++)(a.indexOf(s)>=0||a.length===0)&&(n*=e.inputs[0].dims[s]);return["var sum = f32(0);","",`sum += f32(${i.getByIndices("input_indices")});`,`let value = ${r.type.value}(sum / ${n});`]})},zn=(e,t)=>{xe(e.inputs),ke(e,"ReduceMin",t,(i,r,a)=>{let n=[];for(let s=0;s<i.rank;s++)(a.indexOf(s)>=0||a.length===0)&&n.push(`input_indices[${s}] = 0;`);return[`${n.join(`
`)}`,`var value = ${i.getByIndices("input_indices")};`,`value = min(value, ${i.getByIndices("input_indices")});`,""]})},En=(e,t)=>{xe(e.inputs),ke(e,"ReduceProd",t,(i,r)=>[`var value = ${r.type.storage}(1);`,"",`value *= ${i.getByIndices("input_indices")};`,""])},Cn=(e,t)=>{xe(e.inputs),ke(e,"ReduceSum",t,(i,r)=>[`var value = ${r.type.storage}(0);`,"",`value += ${i.getByIndices("input_indices")};`,""])},Bn=(e,t)=>{xe(e.inputs),ke(e,"ReduceSumSquare",t,(i,r)=>[`var t = ${r.type.value}(0); var value = ${r.type.value}(0);`,"",`t = ${i.getByIndices("input_indices")}; value += t * t;`,""])},Ie=(e,t,i)=>{if(t.length===0)return i;let r=1,a=1;for(let n=0;n<t.length;n++)t.indexOf(n)===-1?r*=e[n]:a*=e[n];return a<32&&r>1024},An=(e,t)=>{Ie(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Tn(e,t):pn(e,t)},On=(e,t)=>{Ie(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?xn(e,t):hn(e,t)},Rn=(e,t)=>{Ie(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?kn(e,t):cn(e,t)},Dn=(e,t)=>{Ie(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?In(e,t):fn(e,t)},Mn=(e,t)=>{Ie(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Sn(e,t):mn(e,t)},Pn=(e,t)=>{Ie(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?zn(e,t):gn(e,t)},Un=(e,t)=>{Ie(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?En(e,t):_n(e,t)},qn=(e,t)=>{Ie(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Cn(e,t):yn(e,t)},Nn=(e,t)=>{Ie(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Bn(e,t):$n(e,t)},Vn=(e,t)=>{Ie(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?vn(e,t):wn(e,t)}}),Pi,Ln,Wn,Ui,Ip=E(()=>{V(),re(),Mi(),Pi=e=>{if(!e||e.length===0||e.length>2)throw new Error("ArgMinMaxOp op requires 1 or 2 inputs.");if(e[0].dataType!==1)throw new Error("Invalid input type.")},Ln=(e,t)=>{Pi(e.inputs);let i=(r,a,n)=>{let s=[];for(let o=0;o<r.rank;o++)(n.indexOf(o)>=0||n.length===0)&&s.push(`input_indices[${o}] = 0;`);return[`${s.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${r.getByIndices("input_indices")} ${t.selectLastIndex>0?"<=":"<"} value) {
         value = ${r.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",a.setByOffset("global_idx","best_index")]};e.compute(Mt("ArgMin",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],i,[t.axis],7,t.keepDims),{inputs:[0]})},Wn=(e,t)=>{Pi(e.inputs);let i=(r,a,n)=>{let s=[];for(let o=0;o<r.rank;o++)(n.indexOf(o)>=0||n.length===0)&&s.push(`input_indices[${o}] = 0;`);return[`${s.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${r.getByIndices("input_indices")} ${t.selectLastIndex>0?">=":">"} value) {
         value = ${r.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",a.setByOffset("global_idx","best_index")]};e.compute(Mt("argMax",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],i,[t.axis],7,t.keepDims),{inputs:[0]})},Ui=e=>Q(e)}),Gn,Pt,Hn,Fn,jn,mt,Kn,Zn,qi=E(()=>{V(),L(),zi(),W(),Gn=(e,t)=>{let i=e[0],r=e[1],a=e[2],n=e[3],s=e[4],o=e[5];if(s&&o)throw new Error("Attention cannot have both past and attention_bias");if(i.dims.length!==3)throw new Error('Input "input" must have 3 dimensions');let u=i.dims[0],l=i.dims[1],d=i.dims[2];if(a.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimensions');if(r.dims.length!==2)throw new Error('Input "weights" is expected to have 2 dimensions');if(r.dims[0]!==d)throw new Error("Input 1 dimension 0 should have same length as dimension 2 of input 0");if(a.dims[0]!==r.dims[1])throw new Error('Input "bias" dimension 0 should have same length as dimension 1 of input "weights"');let p=a.dims[0]/3,h=p,c=h;if(t.qkvHiddenSizes.length>0){if(t.qkvHiddenSizes.length!==3)throw new Error("qkv_hidden_sizes attribute should have 3 elements");for(let w of t.qkvHiddenSizes)if(w%t.numHeads!==0)throw new Error("qkv_hidden_sizes should be divisible by num_heads");p=t.qkvHiddenSizes[0],h=t.qkvHiddenSizes[1],c=t.qkvHiddenSizes[2]}let f=l;if(p!==h)throw new Error("qkv_hidden_sizes first element should be same as the second");if(a.dims[0]!==p+h+c)throw new Error('Input "bias" dimension 0 should have same length as sum of Q/K/V hidden sizes');let m=0;if(s){if(h!==c)throw new Error('Input "past" expect k_hidden_size == v_hidden_size');if(s.dims.length!==5)throw new Error('Input "past" must have 5 dimensions');if(s.dims[0]!==2)throw new Error('Input "past" first dimension must be 2');if(s.dims[1]!==u)throw new Error('Input "past" second dimension must be batch_size');if(s.dims[2]!==t.numHeads)throw new Error('Input "past" third dimension must be num_heads');if(s.dims[4]!==h/t.numHeads)throw new Error('Input "past" fifth dimension must be k_hidden_size / num_heads');t.pastPresentShareBuffer||(m=s.dims[3])}let y=f+m,_=-1,g=0;if(n)throw new Error("Mask not supported");if(s)throw new Error("past is not supported");if(o){if(o.dims.length!==4)throw new Error('Input "attention_bias" must have 4 dimensions');if(o.dims[0]!==u||o.dims[1]!==t.numHeads||o.dims[2]!==l||o.dims[3]!==y)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:u,sequenceLength:l,pastSequenceLength:m,kvSequenceLength:f,totalSequenceLength:y,maxSequenceLength:_,inputHiddenSize:d,hiddenSize:p,vHiddenSize:c,headSize:Math.floor(p/t.numHeads),vHeadSize:Math.floor(c/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:g,scale:t.scale,broadcastResPosBias:!1,passPastInKv:!1,qkvFormat:1}},Pt=(e,t,i)=>t&&e?`
      let total_sequence_length_input = u32(${t.getByOffset("0")});
      let present_sequence_length = max(total_sequence_length_input, uniforms.past_sequence_length);
      let is_subsequent_prompt: bool = sequence_length > 1 && sequence_length != total_sequence_length_input;
      let is_first_prompt: bool = is_subsequent_prompt == false && sequence_length == total_sequence_length_input;
      total_sequence_length = u32(${e==null?void 0:e.getByOffset("batchIdx")}) + 1;
      var past_sequence_length: u32 = 0;
      if (is_first_prompt == false) {
        past_sequence_length = total_sequence_length - sequence_length;
      }
       `:`
    ${i?"let past_sequence_length = uniforms.past_sequence_length":""};
    let present_sequence_length = total_sequence_length;
    `,Hn=(e,t,i,r,a,n,s,o)=>{let u=ie(s?1:n),l=64,d=n/u;d<l&&(l=32);let p=Math.ceil(n/u/l),h=[{type:12,data:t},{type:12,data:i},{type:12,data:r},{type:12,data:a},{type:12,data:d},{type:12,data:p}],c=ae(e.dataType,u),f=oe(1,u),m=["type"];s&&m.push("type"),o&&m.push("type");let y=_=>{let g=O("x",e.dataType,e.dims,u),w=[g],$=s?S("seq_lens",s.dataType,s.dims):void 0;$&&w.push($);let b=o?S("total_sequence_length_input",o.dataType,o.dims):void 0;b&&w.push(b);let x=oe(e.dataType),v=[{name:"batch_size",type:"u32"},{name:"num_heads",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"sequence_length",type:"u32"},{name:"total_sequence_length",type:"u32"},{name:"elements_per_thread",type:"u32"}];return`
  var<workgroup> thread_max: array<f32, ${l}>;
  var<workgroup> thread_sum: array<f32, ${l}>;
  ${_.registerUniforms(v).declareVariables(...w)}
  ${_.mainStart([l,1,1])}
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let sequence_length = uniforms.sequence_length;
    var total_sequence_length = uniforms.total_sequence_length;
    ${Pt($,b,!1)}
    let local_offset = local_idx * uniforms.elements_per_thread;
    let offset = (global_idx / ${l}) * uniforms.total_sequence_length + local_offset;
    let seq_causal_length = ${s?"u32(past_sequence_length + workgroup_id.y + 1)":"total_sequence_length"};
    var thread_max_vector = ${f}(-3.402823e+38f);
    for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
      thread_max_vector = max(${f}(x[offset + i]), thread_max_vector);
    }
    thread_max[local_idx] = ${(()=>{switch(u){case 1:return"thread_max_vector";case 2:return"max(thread_max_vector.x, thread_max_vector.y)";case 4:return"max(max(thread_max_vector.x, thread_max_vector.y), max(thread_max_vector.z, thread_max_vector.w))";default:throw new Error(`Unsupported components: ${u}`)}})()};
    workgroupBarrier();

    var max_value =  f32(-3.402823e+38f);
    for (var i = 0u; i < ${l}; i++) {
      max_value = max(thread_max[i], max_value);
    }

    var sum_vector = ${f}(0);
    for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
      sum_vector += exp(${f}(x[offset + i]) - max_value);
    }
    thread_sum[local_idx] = ${(()=>{switch(u){case 1:return"sum_vector";case 2:return"sum_vector.x + sum_vector.y";case 4:return"sum_vector.x + sum_vector.y + sum_vector.z + sum_vector.w";default:throw new Error(`Unsupported components: ${u}`)}})()};
    workgroupBarrier();

    var sum: f32 = 0;
    for (var i = 0u; i < ${l}; i++) {
      sum += thread_sum[i];
    }

    if (sum == 0) {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        x[offset + i] = ${g.type.value}(${x}(1.0) / ${x}(seq_causal_length));
      }
    } else {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        var f32input = ${f}(x[offset + i]);
        x[offset + i] = ${g.type.value}(exp(f32input - max_value) / sum);
      }
    }
      ${s?`
        for (var total_seq_id: u32 = seq_causal_length; total_seq_id + local_offset < uniforms.total_sequence_length; total_seq_id++) {
          x[offset + total_seq_id] = ${g.type.value}(${x}(0));
        }`:""};
  }`};return{name:"AttentionProbsSoftmax",shaderCache:{hint:`${l};${c};${u}`,inputDependencies:m},getShaderSource:y,getRunData:()=>({outputs:[],dispatchGroup:{x:1,y:a,z:t*i},programUniforms:h})}},Fn=(e,t,i,r,a,n,s,o,u)=>{let l=s+n.kvSequenceLength,d=[n.batchSize,n.numHeads,n.sequenceLength,l],p=e>1&&r,h=n.kvNumHeads?n.kvNumHeads:n.numHeads,c=p?[n.batchSize,h,l,n.headSize]:void 0,f=n.nReps?n.nReps:1,m=n.scale===0?1/Math.sqrt(n.headSize):n.scale,y=ie(n.headSize),_=n.headSize/y,g=12,w={x:Math.ceil(l/g),y:Math.ceil(n.sequenceLength/g),z:n.batchSize*n.numHeads},$=[{type:12,data:n.sequenceLength},{type:12,data:_},{type:12,data:l},{type:12,data:n.numHeads},{type:12,data:n.headSize},{type:1,data:m},{type:12,data:s},{type:12,data:n.kvSequenceLength},{type:12,data:f}],b=p&&r&&k.size(r.dims)>0,x=["type","type"];b&&x.push("type"),a&&x.push("type"),o&&x.push("type"),u&&x.push("type");let v=[{dims:d,dataType:t.dataType,gpuDataType:0}];p&&v.push({dims:c,dataType:t.dataType,gpuDataType:0});let I=T=>{let C=S("q",t.dataType,t.dims,y),q=S("key",i.dataType,i.dims,y),D=[C,q];if(b){let G=S("past_key",r.dataType,r.dims,y);D.push(G)}a&&D.push(S("attention_bias",a.dataType,a.dims));let P=o?S("seq_lens",o.dataType,o.dims):void 0;P&&D.push(P);let Z=u?S("total_sequence_length_input",u.dataType,u.dims):void 0;Z&&D.push(Z);let H=O("output",t.dataType,d),U=[H];p&&U.push(O("present_key",t.dataType,c,y));let A=oe(1,y),J=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"alpha",type:"f32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${g}u;

  var<workgroup> tileQ: array<${C.type.storage}, ${g*g}>;
  var<workgroup> tileK: array<${C.type.storage}, ${g*g}>;
  ${T.registerUniforms(J).declareVariables(...D,...U)}
  ${T.mainStart([g,g,1])}
    // x holds the N and y holds the M
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let kvHeadIdx = ${f===1?"headIdx":"headIdx / uniforms.n_reps"};
    let kv_num_heads = ${f===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let m = workgroup_id.y * TILE_SIZE;
    let n = workgroup_id.x * TILE_SIZE;
    let sequence_length = uniforms.M;
    var total_sequence_length = uniforms.N;
    ${Pt(P,Z,!0)}
    let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx;
    let qOffset = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
    ${b&&p?"let pastKeyOffset = absKvHeadIdx * uniforms.past_sequence_length * uniforms.K;":""};
    let kOffset = absKvHeadIdx * uniforms.kv_sequence_length * uniforms.K;
    ${p?"let presentKeyOffset = absKvHeadIdx * uniforms.N * uniforms.K;":""}
    var value = ${A}(0);
    for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (global_id.y < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = q[qOffset + local_id.y * uniforms.K + w + local_id.x];
      }
      if (n + local_id.y < uniforms.N && w + local_id.x < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
      ${b&&p?`
              if (n + local_id.y < past_sequence_length) {
                tileK[idx] = past_key[pastKeyOffset + (n + local_id.y) * uniforms.K + w + local_id.x];
              } else if (n + local_id.y - past_sequence_length < uniforms.kv_sequence_length) {
                tileK[idx] = key[kOffset + (n + local_id.y - past_sequence_length) * uniforms.K + w + local_id.x];
              }`:`
          if (n + local_id.y < uniforms.kv_sequence_length) {
            tileK[idx] = key[kOffset + (n + local_id.y) * uniforms.K + w + local_id.x];
          }`}
      ${p?`if (n + local_id.y < present_sequence_length) {
        present_key[presentKeyOffset + (n + local_id.y) * uniforms.K + w + local_id.x] = tileK[idx];
      }`:""}
      }
      workgroupBarrier();

      for (var k: u32 = 0u; k < TILE_SIZE && w+k < uniforms.K; k++) {
          value += ${A}(tileQ[TILE_SIZE * local_id.y + k] * tileK[TILE_SIZE * local_id.x + k]);
      }

      workgroupBarrier();
    }

    if (global_id.y < uniforms.M && global_id.x < total_sequence_length) {
      let headOffset = workgroup_id.z * uniforms.M * uniforms.N;
      let outputIdx = headOffset + global_id.y * uniforms.N + global_id.x;
      var sum: f32 = ${(()=>{switch(y){case 1:return"value";case 2:return"value.x + value.y";case 4:return"value.x + value.y + value.z + value.w";default:throw new Error(`Unsupported components: ${y}`)}})()};
        output[outputIdx] = ${H.type.value} (sum * uniforms.alpha) + ${a?"attention_bias[outputIdx]":"0.0"};
    }
  }`};return{name:"AttentionProbs",shaderCache:{hint:`${y};${a!==void 0};${r!==void 0};${e}`,inputDependencies:x},getRunData:()=>({outputs:v,dispatchGroup:w,programUniforms:$}),getShaderSource:I}},jn=(e,t,i,r,a,n,s=void 0,o=void 0)=>{let u=n+a.kvSequenceLength,l=a.nReps?a.nReps:1,d=a.vHiddenSize*l,p=e>1&&r,h=a.kvNumHeads?a.kvNumHeads:a.numHeads,c=p?[a.batchSize,h,u,a.headSize]:void 0,f=[a.batchSize,a.sequenceLength,d],m=12,y={x:Math.ceil(a.vHeadSize/m),y:Math.ceil(a.sequenceLength/m),z:a.batchSize*a.numHeads},_=[{type:12,data:a.sequenceLength},{type:12,data:u},{type:12,data:a.vHeadSize},{type:12,data:a.numHeads},{type:12,data:a.headSize},{type:12,data:d},{type:12,data:n},{type:12,data:a.kvSequenceLength},{type:12,data:l}],g=p&&r&&k.size(r.dims)>0,w=["type","type"];g&&w.push("type"),s&&w.push("type"),o&&w.push("type");let $=[{dims:f,dataType:t.dataType,gpuDataType:0}];p&&$.push({dims:c,dataType:t.dataType,gpuDataType:0});let b=x=>{let v=S("probs",t.dataType,t.dims),I=S("v",i.dataType,i.dims),T=[v,I];g&&T.push(S("past_value",r.dataType,r.dims));let C=s?S("seq_lens",s.dataType,s.dims):void 0;s&&T.push(C);let q=o?S("total_sequence_length_input",o.dataType,o.dims):void 0;o&&T.push(q);let D=[O("output",t.dataType,f)];p&&D.push(O("present_value",t.dataType,c));let P=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"v_hidden_size",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${m}u;
  var<workgroup> tileQ: array<${v.type.value}, ${m*m}>;
  var<workgroup> tileV: array<${v.type.value}, ${m*m}>;
  ${x.registerUniforms(P).declareVariables(...T,...D)}
  ${x.mainStart([m,m,1])}
   let headIdx = workgroup_id.z % uniforms.num_heads;
   let batchIdx = workgroup_id.z / uniforms.num_heads;
   let kvHeadIdx = ${l===1?"headIdx":"headIdx / uniforms.n_reps"};
   let kv_num_heads = ${l===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
   let m = global_id.y;
   let n = global_id.x;
   let sequence_length = uniforms.M;
   var total_sequence_length = uniforms.K;
   ${Pt(C,q,!0)}
   let offsetA = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
   let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx; // kvHeadIdx is relative to the batch
   ${g&&p?"let pastValueOffset = absKvHeadIdx * uniforms.N * uniforms.past_sequence_length + n;":""};
   let vOffset = absKvHeadIdx * uniforms.N * uniforms.kv_sequence_length + n;
   ${p?"let presentValueOffset = absKvHeadIdx * uniforms.N * uniforms.K + n;":""}
   var value = ${v.type.storage}(0);
   for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (m < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = probs[offsetA + w + local_id.x];
      }
      if (n < uniforms.N && w + local_id.y < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
        ${g&&p?`
        if (w + local_id.y < past_sequence_length) {
          tileV[idx] = past_value[pastValueOffset + (w + local_id.y) * uniforms.N];
        } else if (w + local_id.y - past_sequence_length < uniforms.kv_sequence_length) {
          tileV[idx] = v[vOffset + (w + local_id.y - past_sequence_length) * uniforms.N];
        }
      `:`
            if (w + local_id.y < uniforms.kv_sequence_length) {
              tileV[idx] = v[vOffset + (w + local_id.y) * uniforms.N];
            }`}
        ${p?`
            if (w + local_id.y < present_sequence_length) {
          present_value[presentValueOffset + (w + local_id.y) * uniforms.N] = tileV[idx];
        }`:""}
      }
     workgroupBarrier();
     for (var k: u32 = 0u; k < TILE_SIZE && w+k < total_sequence_length; k++) {
       value += tileQ[TILE_SIZE * local_id.y + k] * tileV[TILE_SIZE * k + local_id.x];
     }
     workgroupBarrier();
   }

   // we need to transpose output from BNSH_v to BSND_v
   if (m < uniforms.M && n < uniforms.N) {
     let outputIdx = batchIdx * uniforms.M * uniforms.v_hidden_size + m * uniforms.v_hidden_size
       + headIdx * uniforms.N + n;
     output[outputIdx] = value;
   }
  }`};return{name:"AttentionScore",shaderCache:{hint:`${r!==void 0};${e}`,inputDependencies:w},getRunData:()=>({outputs:$,dispatchGroup:y,programUniforms:_}),getShaderSource:b}},mt=(e,t,i,r,a,n,s,o,u,l,d=void 0,p=void 0)=>{let h=Math.min(e.outputCount,1+(s?1:0)+(o?1:0)),c=h>1?l.pastSequenceLength:0,f=c+l.kvSequenceLength,m=u&&k.size(u.dims)>0?u:void 0,y=[t,i];h>1&&s&&k.size(s.dims)>0&&y.push(s),m&&y.push(m),d&&y.push(d),p&&y.push(p);let _=e.compute(Fn(h,t,i,s,m,l,c,d,p),{inputs:y,outputs:h>1?[-1,1]:[-1]})[0];e.compute(Hn(_,l.batchSize,l.numHeads,c,l.sequenceLength,f,d,p),{inputs:d&&p?[_,d,p]:[_],outputs:[]});let g=[_,r];h>1&&o&&k.size(o.dims)>0&&g.push(o),d&&g.push(d),p&&g.push(p),e.compute(jn(h,_,r,o,l,c,d,p),{inputs:g,outputs:h>1?[0,2]:[0]})},Kn=(e,t)=>{let i=[t.batchSize,t.numHeads,t.sequenceLength,t.headSize],r=t.sequenceLength,a=t.inputHiddenSize,n=t.headSize,s=12,o={x:Math.ceil(t.headSize/s),y:Math.ceil(t.sequenceLength/s),z:t.batchSize*t.numHeads},u=[e.inputs[0],e.inputs[1],e.inputs[2]],l=[{type:12,data:r},{type:12,data:a},{type:12,data:n},{type:12,data:t.numHeads},{type:12,data:t.headSize},{type:12,data:t.hiddenSize},{type:12,data:t.hiddenSize+t.hiddenSize+t.vHiddenSize}],d=p=>{let h=O("output_q",u[0].dataType,i),c=O("output_k",u[0].dataType,i),f=O("output_v",u[0].dataType,i),m=S("input",u[0].dataType,u[0].dims),y=S("weight",u[1].dataType,u[1].dims),_=S("bias",u[2].dataType,u[2].dims),g=m.type.storage,w=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"hidden_size",type:"u32"},{name:"ldb",type:"u32"}];return`
  const TILE_SIZE = ${s}u;
  var<workgroup> tileInput: array<${g}, ${s*s}>;
  var<workgroup> tileWeightQ: array<${g}, ${s*s}>;
  var<workgroup> tileWeightK: array<${g}, ${s*s}>;
  var<workgroup> tileWeightV: array<${g}, ${s*s}>;
  ${p.registerUniforms(w).declareVariables(m,y,_,h,c,f)}
  ${p.mainStart([s,s,1])}
    let batchIndex = workgroup_id.z / uniforms.num_heads;
    let headNumber = workgroup_id.z % uniforms.num_heads;
    let m = global_id.y;
    let n = global_id.x;

    let inputOffset = batchIndex * (uniforms.M * uniforms.K) + m * uniforms.K;
    let biasOffsetQ = headNumber * uniforms.head_size;
    let biasOffsetK = uniforms.hidden_size + biasOffsetQ;
    let biasOffsetV = uniforms.hidden_size + biasOffsetK;

    var valueQ = ${g}(0);
    var valueK = ${g}(0);
    var valueV = ${g}(0);
    for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (m < uniforms.M && w + local_id.x < uniforms.K) {
        tileInput[TILE_SIZE * local_id.y + local_id.x] = input[inputOffset + w + local_id.x];
      }
      if (n < uniforms.N && w + local_id.y < uniforms.K) {
        let offset = n + (w + local_id.y) * uniforms.ldb;
        tileWeightQ[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetQ + offset];
        tileWeightK[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetK + offset];
        tileWeightV[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetV + offset];
      }
      workgroupBarrier();
      for (var k: u32 = 0u; k<TILE_SIZE && w+k < uniforms.K; k++) {
        let inputTileOffset = TILE_SIZE * local_id.y + k;
        let weightTileOffset = TILE_SIZE * k + local_id.x;
        valueQ += tileInput[inputTileOffset] * tileWeightQ[weightTileOffset];
        valueK += tileInput[inputTileOffset] * tileWeightK[weightTileOffset];
        valueV += tileInput[inputTileOffset] * tileWeightV[weightTileOffset];
      }

      workgroupBarrier();
    }

    let headOffset = (m * uniforms.N + n) % uniforms.head_size;
    valueQ += bias[headOffset + biasOffsetQ];
    valueK += bias[headOffset + biasOffsetK];
    valueV += bias[headOffset + biasOffsetV];

    let offset = workgroup_id.z * uniforms.M * uniforms.N;
    if (m < uniforms.M && n < uniforms.N) {
      let outputIdx = offset + m * uniforms.N + n;
      output_q[outputIdx] = valueQ;
      output_k[outputIdx] = valueK;
      output_v[outputIdx] = valueV;
    }
  }`};return e.compute({name:"AttentionPrepare",shaderCache:{inputDependencies:["type","type","type"]},getRunData:()=>({outputs:[{dims:i,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:i,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:i,dataType:e.inputs[0].dataType,gpuDataType:0}],dispatchGroup:o,programUniforms:l}),getShaderSource:d},{inputs:u,outputs:[-1,-1,-1]})},Zn=(e,t)=>{let i=Gn(e.inputs,t),[r,a,n]=Kn(e,i);return mt(e,r,a,n,e.inputs[4],void 0,void 0,void 0,e.inputs[5],i)}}),Qn,Xn,Yn,Jn,Sp=E(()=>{we(),V(),L(),re(),W(),Qn=(e,t)=>{if(!e||e.length!==5)throw new Error("BatchNormalization requires 5 inputs");let i=(r,a,n)=>{let s=a.length;if(s!==r.length)throw new Error(`${n}: num dimensions != ${s}`);a.forEach((o,u)=>{if(o!==r[u])throw new Error(`${n}: dim[${u}] do not match`)})};if(e[0].dims.length>1){let r=t.format==="NHWC"?t.spatial?e[0].dims.slice(-1):e[0].dims.slice(-1).concat(e[0].dims.slice(1,e[0].dims.length-1)):e[0].dims.slice(1,t.spatial?2:void 0);i(e[1].dims,r,"Invalid input scale"),i(e[2].dims,r,"Invalid input B"),i(e[3].dims,r,"Invalid input mean"),i(e[4].dims,r,"Invalid input var")}else i(e[1].dims,[1],"Invalid input scale"),i(e[2].dims,[1],"Invalid input B"),i(e[3].dims,[1],"Invalid input mean"),i(e[4].dims,[1],"Invalid input var")},Xn=(e,t)=>{let{epsilon:i,spatial:r,format:a}=t,n=e[0].dims,s=r?ie(n[n.length-1]):1,o=a==="NHWC"&&n.length>1?s:1,u=k.size(n)/s,l=r,d=l?n.length:n,p=S("x",e[0].dataType,e[0].dims,s),h=S("scale",e[1].dataType,e[1].dims,o),c=S("bias",e[2].dataType,e[2].dims,o),f=S("inputMean",e[3].dataType,e[3].dims,o),m=S("inputVar",e[4].dataType,e[4].dims,o),y=O("y",e[0].dataType,d,s),_=()=>{let w="";if(r)w=`let cOffset = ${n.length===1?"0u":a==="NHWC"?`outputIndices[${n.length-1}] / ${s}`:"outputIndices[1]"};`;else if(a==="NCHW")w=`
            ${y.indicesSet("outputIndices","0","0")}
            let cOffset = ${y.indicesToOffset("outputIndices")};`;else{w=`var cIndices = ${h.type.indices}(0);
                       cIndices[0] = outputIndices[${n.length-1}];`;for(let $=1;$<h.rank;$++)w+=`cIndices[${$}] = outputIndices[${$}];`;w+=`let cOffset = ${h.indicesToOffset("cIndices")};`}return w},g=w=>`
  const epsilon = ${i};
  ${w.registerUniform("outputSize","u32").declareVariables(p,h,c,f,m,y)}
  ${w.mainStart()}
  ${w.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
    var outputIndices = ${y.offsetToIndices(`global_idx * ${s}`)};
    ${_()}
    let scale = ${h.getByOffset("cOffset")};
    let bias = ${c.getByOffset("cOffset")};
    let inputMean = ${f.getByOffset("cOffset")};
    let inputVar = ${m.getByOffset("cOffset")};
    let x = ${p.getByOffset("global_idx")};
    let value = (x - inputMean) * inverseSqrt(inputVar + epsilon) * scale + bias;
    ${y.setByOffset("global_idx","value")}
  }`;return{name:"BatchNormalization",shaderCache:{hint:`${t.epsilon}_${t.format}_${r}_${s}`,inputDependencies:l?["rank","type","type","type","type"]:void 0},getShaderSource:g,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:l?[{type:12,data:u},...M(n)]:[{type:12,data:u}]})}},Yn=e=>Q(e),Jn=(e,t)=>{let{inputs:i,outputCount:r}=e,a=Yn({...t,outputCount:r});if(te.webgpu.validateInputContent&&Qn(i,a),t.trainingMode)throw new Error("BatchNormalization trainingMode is not supported yet.");e.compute(Xn(i,a))}}),es,ts,is,Tp=E(()=>{L(),W(),es=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![320,640,1280].includes(e[0].dims[2]))throw new Error("number of channels should be 320, 640 or 1280");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},ts=e=>{let t=e[0].dims,i=e[0].dims[2],r=k.size(t)/4,a=e[0].dataType,n=S("input",a,t,4),s=S("bias",a,[i],4),o=S("residual",a,t,4),u=O("output",a,t,4);return{name:"BiasAdd",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(r/64)}}),getShaderSource:l=>`
  const channels = ${i}u / 4;
  ${l.declareVariables(n,s,o,u)}

  ${l.mainStart()}
    ${l.guardAgainstOutOfBoundsWorkgroupSizes(r)}
    let value = ${n.getByOffset("global_idx")}
      + ${s.getByOffset("global_idx % channels")} + ${o.getByOffset("global_idx")};
    ${u.setByOffset("global_idx","value")}
  }`}},is=e=>{es(e.inputs),e.compute(ts(e.inputs))}}),rs,K,as,ns,ss,os,us,ls,ds,ps,hs,cs,fs,ms,gs,_s,gt,ys,Ut,$s,ws,bs,vs,xs,ks,Is,Ss,Ts,zs,Es,Cs,Bs,As,Os,Rs,Ni,Ds,Vi,Li,Ms,Ps,Us,qs,Ns,Vs,Wi=E(()=>{V(),L(),re(),W(),rs=(e,t,i,r,a,n,s)=>{let o=Math.ceil(t/4),u="";typeof a=="string"?u=`${a}(a)`:u=a("a");let l=S("inputData",i,[o],4),d=O("outputData",r,[o],4),p=[{name:"vec_size",type:"u32"}];return s&&p.push(...s),`
      ${e.registerUniforms(p).declareVariables(l,d)}

  ${n??""}

  ${e.mainStart()}
    ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}

    let a = ${l.getByOffset("global_idx")};
    ${d.setByOffset("global_idx",u)}
  }`},K=(e,t,i,r,a,n=e.dataType,s,o)=>{let u=[{type:12,data:Math.ceil(k.size(e.dims)/4)}];return s&&u.push(...s),{name:t,shaderCache:{hint:a,inputDependencies:["type"]},getShaderSource:l=>rs(l,k.size(e.dims),e.dataType,n,i,r,o),getRunData:l=>({outputs:[{dims:e.dims,dataType:n}],dispatchGroup:{x:Math.ceil(k.size(l[0].dims)/64/4)},programUniforms:u})}},as=e=>{e.compute(K(e.inputs[0],"Abs","abs"))},ns=e=>{e.compute(K(e.inputs[0],"Acos","acos"))},ss=e=>{e.compute(K(e.inputs[0],"Acosh","acosh"))},os=e=>{e.compute(K(e.inputs[0],"Asin","asin"))},us=e=>{e.compute(K(e.inputs[0],"Asinh","asinh"))},ls=e=>{e.compute(K(e.inputs[0],"Atan","atan"))},ds=e=>{e.compute(K(e.inputs[0],"Atanh","atanh"))},ps=e=>Q(e),hs=(e,t)=>{let i;switch(t.to){case 10:i="vec4<f16>";break;case 1:i="vec4<f32>";break;case 12:i="vec4<u32>";break;case 6:i="vec4<i32>";break;case 9:i="vec4<bool>";break;default:throw new RangeError(`not supported type (specified in attribute 'to' from 'Cast' operator): ${t.to}`)}e.compute(K(e.inputs[0],"Cast",i,void 0,t.cacheKey,t.to))},cs=e=>{let t,i,r=e.length>=2&&e[1].data!==0,a=e.length>=3&&e[2].data!==0;switch(e[0].dataType){case 1:t=r?e[1].getFloat32Array()[0]:-34028234663852886e22,i=a?e[2].getFloat32Array()[0]:34028234663852886e22;break;case 10:t=r?e[1].getUint16Array()[0]:64511,i=a?e[2].getUint16Array()[0]:31743;break;default:throw new Error("Unsupport data type")}return Q({min:t,max:i})},fs=(e,t)=>{let i=t||cs(e.inputs),r=oe(e.inputs[0].dataType);e.compute(K(e.inputs[0],"Clip",a=>`clamp(${a}, vec4<${r}>(uniforms.min), vec4<${r}>(uniforms.max))`,void 0,i.cacheKey,void 0,[{type:e.inputs[0].dataType,data:i.min},{type:e.inputs[0].dataType,data:i.max}],[{name:"min",type:r},{name:"max",type:r}]),{inputs:[0]})},ms=e=>{e.compute(K(e.inputs[0],"Ceil","ceil"))},gs=e=>{e.compute(K(e.inputs[0],"Cos","cos"))},_s=e=>{e.compute(K(e.inputs[0],"Cosh","cosh"))},gt=e=>Q(e),ys=(e,t)=>{let i=oe(e.inputs[0].dataType);e.compute(K(e.inputs[0],"Elu",r=>`elu_vf32(${r})`,`
  const elu_alpha_ = ${i}(${t.alpha});

  fn elu_f32(a: ${i}) -> ${i} {
  return select((exp(a) - 1.0) * elu_alpha_, a, a >= 0.0);
  }

  fn elu_vf32(v: vec4<${i}>) -> vec4<${i}> {
  return vec4(elu_f32(v.x), elu_f32(v.y), elu_f32(v.z), elu_f32(v.w));
  }`,t.cacheKey))},Ut=(e="f32")=>`
const r0: ${e} = 0.3275911;
const r1: ${e} = 0.254829592;
const r2: ${e} = -0.284496736;
const r3: ${e} = 1.421413741;
const r4: ${e} = -1.453152027;
const r5: ${e} = 1.061405429;

fn erf_vf32(v: vec4<${e}>) -> vec4<${e}> {
  let absv = abs(v);
  let x = 1.0 / (1.0 + r0 * absv);
  return sign(v) * (1.0 - ((((r5 * x + r4) * x + r3) * x + r2) * x + r1) * x * exp(-absv * absv));
}`,$s=e=>{let t=oe(e.inputs[0].dataType);e.compute(K(e.inputs[0],"Erf",i=>`erf_vf32(${i})`,Ut(t)))},ws=e=>{e.compute(K(e.inputs[0],"Exp","exp"))},bs=e=>{e.compute(K(e.inputs[0],"Floor","floor"))},vs=e=>{let t=oe(e.inputs[0].dataType);e.compute(K(e.inputs[0],"Gelu",i=>`0.5 * ${i} * (1.0 + erf_vf32(${i} * 0.7071067811865475))`,Ut(t)))},xs=(e,t)=>{let i=oe(e.inputs[0].dataType);e.compute(K(e.inputs[0],"LeakyRelu",r=>`select(leaky_relu_alpha_ * ${r}, ${r}, ${r} >= vec4<${i}>(0.0))`,`const leaky_relu_alpha_ = ${i}(${t.alpha});`,t.cacheKey))},ks=e=>{e.compute(K(e.inputs[0],"Not",t=>`!${t}`))},Is=e=>{e.compute(K(e.inputs[0],"Neg",t=>`-${t}`))},Ss=e=>{e.compute(K(e.inputs[0],"Reciprocal",t=>`1.0/${t}`))},Ts=e=>{let t=oe(e.inputs[0].dataType);e.compute(K(e.inputs[0],"Relu",i=>`select(vec4<${t}>(0.0), ${i}, ${i} > vec4<${t}>(0.0))`))},zs=e=>{e.compute(K(e.inputs[0],"Sigmoid",t=>`(1.0 / (1.0 + exp(-${t})))`))},Es=e=>Q(e),Cs=(e,t)=>{let i=oe(e.inputs[0].dataType);e.compute(K(e.inputs[0],"HardSigmoid",r=>`max(vec4<${i}>(0.0), min(vec4<${i}>(1.0), ${t.alpha} * ${r} + vec4<${i}>(${t.beta})))`,void 0,t.cacheKey))},Bs=e=>{e.compute(K(e.inputs[0],"Sin","sin"))},As=e=>{e.compute(K(e.inputs[0],"Sinh","sinh"))},Os=e=>{e.compute(K(e.inputs[0],"Sqrt","sqrt"))},Rs=e=>{e.compute(K(e.inputs[0],"Tan","tan"))},Ni=e=>`sign(${e}) * (1 - exp(-2 * abs(${e}))) / (1 + exp(-2 * abs(${e})))`,Ds=e=>{e.compute(K(e.inputs[0],"Tanh",Ni))},Vi=(e="f32")=>`
const fast_gelu_a: ${e} = 0.5;
const fast_gelu_b: ${e} = 0.7978845608028654;
const fast_gelu_c: ${e} = 0.035677408136300125;

fn tanh_v(v: vec4<${e}>) -> vec4<${e}> {
  return ${Ni("v")};
}
`,Li=e=>`(fast_gelu_a + fast_gelu_a * tanh_v(${e} * (fast_gelu_c * ${e} * ${e} + fast_gelu_b))) * ${e}`,Ms=e=>{let t=oe(e.inputs[0].dataType);e.compute(K(e.inputs[0],"FastGelu",Li,Vi(t),void 0,e.inputs[0].dataType))},Ps=(e,t)=>{let i=oe(e.inputs[0].dataType);return e.compute(K(e.inputs[0],"ThresholdedRelu",r=>`select(vec4<${i}>(0.0), ${r}, ${r} > thresholded_relu_alpha_)`,`const thresholded_relu_alpha_ = vec4<${i}>(${t.alpha});`,t.cacheKey)),0},Us=e=>{e.compute(K(e.inputs[0],"Log","log"))},qs=(e,t)=>`
const alpha = vec4<${e}>(${t});
const one = ${e}(1.0);
const zero = ${e}(0.0);

fn quick_gelu_impl(x: vec4<${e}>) -> vec4<${e}> {
  let v = x *alpha;
  var x1 : vec4<${e}>;
  for (var i = 0; i < 4; i = i + 1) {
    if (v[i] >= zero) {
      x1[i] = one / (one + exp(-v[i]));
    } else {
      x1[i] = one - one / (one + exp(v[i]));
    }
  }
  return x * x1;
}
`,Ns=e=>`quick_gelu_impl(${e})`,Vs=(e,t)=>{let i=oe(e.inputs[0].dataType);e.compute(K(e.inputs[0],"QuickGelu",Ns,qs(i,t.alpha),t.cacheKey,e.inputs[0].dataType))}}),Ls,Ws,Gs,zp=E(()=>{L(),W(),Wi(),Ls=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![2560,5120,10240].includes(e[0].dims[2]))throw new Error("hidden state should be 2560, 5120 or 10240");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},Ws=e=>{let t=e[0].dims.slice();t[2]=t[2]/2;let i=S("input",e[0].dataType,e[0].dims,4),r=S("bias",e[0].dataType,[e[0].dims[2]],4),a=O("output",e[0].dataType,t,4),n=k.size(t)/4,s=ae(e[0].dataType);return{name:"BiasSplitGelu",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(n/64)}}),getShaderSource:o=>`
  const M_SQRT2 = sqrt(2.0);
  const halfChannels = ${e[0].dims[2]/4/2}u;

  ${o.declareVariables(i,r,a)}

  ${Ut(s)}

  ${o.mainStart()}
    ${o.guardAgainstOutOfBoundsWorkgroupSizes(n)}
    let biasIdx = global_idx % halfChannels;
    let batchIndex = global_idx / halfChannels;
    let inputOffset = biasIdx + batchIndex * halfChannels * 2;
    let valueLeft = input[inputOffset] + bias[biasIdx];
    let valueRight = input[inputOffset + halfChannels] + bias[biasIdx + halfChannels];
    let geluRight = valueRight * 0.5 * (erf_vf32(valueRight / M_SQRT2) + 1);

    ${a.setByOffset("global_idx","valueLeft * geluRight")}
  }`}},Gs=e=>{Ls(e.inputs),e.compute(Ws(e.inputs))}}),Hs,Fs,Se,js,Ks,Zs,Qs,Xs,Ys,Js,eo,to,io,Ep=E(()=>{V(),L(),W(),Hs=(e,t,i,r,a,n,s,o,u,l,d,p)=>{let h,c;typeof o=="string"?h=c=(g,w)=>`${o}((${g}),(${w}))`:typeof o=="function"?h=c=o:(h=o.scalar,c=o.vector);let f=O("outputData",d,r.length,4),m=S("aData",u,t.length,4),y=S("bData",l,i.length,4),_;if(a)if(n){let g=k.size(t)===1,w=k.size(i)===1,$=t.length>0&&t[t.length-1]%4===0,b=i.length>0&&i[i.length-1]%4===0;g||w?_=f.setByOffset("global_idx",c(g?`${m.type.value}(${m.getByOffset("0")}.x)`:m.getByOffset("global_idx"),w?`${y.type.value}(${y.getByOffset("0")}.x)`:y.getByOffset("global_idx"))):_=`
            let outputIndices = ${f.offsetToIndices("global_idx * 4u")};
            let offsetA = ${m.broadcastedIndicesToOffset("outputIndices",f)};
            let offsetB = ${y.broadcastedIndicesToOffset("outputIndices",f)};
            ${f.setByOffset("global_idx",c(s||$?m.getByOffset("offsetA / 4u"):`${m.type.value}(${m.getByOffset("offsetA / 4u")}[offsetA % 4u])`,s||b?y.getByOffset("offsetB / 4u"):`${y.type.value}(${y.getByOffset("offsetB / 4u")}[offsetB % 4u])`))}
          `}else _=f.setByOffset("global_idx",c(m.getByOffset("global_idx"),y.getByOffset("global_idx")));else{if(!n)throw new Error("no necessary to use scalar implementation for element-wise binary op implementation.");let g=(w,$,b="")=>{let x=`aData[indexA${$}][componentA${$}]`,v=`bData[indexB${$}][componentB${$}]`;return`
            let outputIndices${$} = ${f.offsetToIndices(`global_idx * 4u + ${$}u`)};
            let offsetA${$} = ${m.broadcastedIndicesToOffset(`outputIndices${$}`,f)};
            let offsetB${$} = ${y.broadcastedIndicesToOffset(`outputIndices${$}`,f)};
            let indexA${$} = offsetA${$} / 4u;
            let indexB${$} = offsetB${$} / 4u;
            let componentA${$} = offsetA${$} % 4u;
            let componentB${$} = offsetB${$} % 4u;
            ${w}[${$}] = ${b}(${h(x,v)});
          `};d===9?_=`
            var data = vec4<u32>(0);
            ${g("data",0,"u32")}
            ${g("data",1,"u32")}
            ${g("data",2,"u32")}
            ${g("data",3,"u32")}
            outputData[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:_=`
            ${g("outputData[global_idx]",0)}
            ${g("outputData[global_idx]",1)}
            ${g("outputData[global_idx]",2)}
            ${g("outputData[global_idx]",3)}
          `}return`
        ${e.registerUniform("vec_size","u32").declareVariables(m,y,f)}

        ${p??""}

        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${_}
      }`},Fs=(e,t,i,r,a,n,s=i.dataType)=>{let o=i.dims.map(m=>Number(m)??1),u=r.dims.map(m=>Number(m)??1),l=!k.areEqual(o,u),d=o,p=k.size(o),h=!1,c=!1,f=[l];if(l){let m=tt.calcShape(o,u,!1);if(!m)throw new Error("Can't perform binary op on the given tensors");d=m.slice(),p=k.size(d);let y=k.size(o)===1,_=k.size(u)===1,g=o.length>0&&o[o.length-1]%4===0,w=u.length>0&&u[u.length-1]%4===0;f.push(y),f.push(_),f.push(g),f.push(w);let $=1;for(let b=1;b<d.length;b++){let x=o[o.length-b],v=u[u.length-b];if(x===v)$*=x;else break}$%4===0?(c=!0,h=!0):(y||_||g||w)&&(h=!0)}else h=!0;return f.push(h),{name:e,shaderCache:{hint:t+f.map(m=>m.toString()).join("_"),inputDependencies:["rank","rank"]},getShaderSource:m=>Hs(m,o,u,d,h,l,c,a,i.dataType,r.dataType,s,n),getRunData:()=>({outputs:[{dims:d,dataType:s}],dispatchGroup:{x:Math.ceil(p/64/4)},programUniforms:[{type:12,data:Math.ceil(k.size(d)/4)},...M(o,u,d)]})}},Se=(e,t,i,r,a,n)=>{e.compute(Fs(t,a??"",e.inputs[0],e.inputs[1],i,r,n))},js=e=>{Se(e,"Add",(t,i)=>`${t}+${i}`)},Ks=e=>{Se(e,"Div",(t,i)=>`${t}/${i}`)},Zs=e=>{Se(e,"Equal",{scalar:(t,i)=>`u32(${t}==${i})`,vector:(t,i)=>`vec4<u32>(${t}==${i})`},void 0,void 0,9)},Qs=e=>{Se(e,"Mul",(t,i)=>`${t}*${i}`)},Xs=e=>{let t=S("input",e.inputs[0].dataType,e.inputs[0].dims).type.value;Se(e,"Pow",{scalar:(i,r)=>`pow_custom(${i},${r})`,vector:(i,r)=>`pow_vector_custom(${i},${r})`},`
    fn pow_custom(a : ${t}, b : ${t}) -> ${t} {
      if (b == ${t}(0.0)) {
        return ${t}(1.0);
      } else if (a < ${t}(0.0) && f32(b) != floor(f32(b))) {
        return ${t}(pow(f32(a), f32(b))); // NaN
      }
      return select(sign(a), ${t}(1.0), round(f32(abs(b) % ${t}(2.0))) != 1.0) * ${t}(${t==="i32"?"round":""}(pow(f32(abs(a)), f32(b))));
    }
    fn pow_vector_custom(a : vec4<${t}>, b : vec4<${t}>) -> vec4<${t}> {
      // TODO: implement vectorized pow
      return vec4<${t}>(pow_custom(a.x, b.x), pow_custom(a.y, b.y), pow_custom(a.z, b.z), pow_custom(a.w, b.w));
    }
      `)},Ys=e=>{Se(e,"Sub",(t,i)=>`${t}-${i}`)},Js=e=>{Se(e,"Greater",{scalar:(t,i)=>`u32(${t}>${i})`,vector:(t,i)=>`vec4<u32>(${t}>${i})`},void 0,void 0,9)},eo=e=>{Se(e,"Less",{scalar:(t,i)=>`u32(${t}<${i})`,vector:(t,i)=>`vec4<u32>(${t}<${i})`},void 0,void 0,9)},to=e=>{Se(e,"GreaterOrEqual",{scalar:(t,i)=>`u32(${t}>=${i})`,vector:(t,i)=>`vec4<u32>(${t}>=${i})`},void 0,void 0,9)},io=e=>{Se(e,"LessOrEqual",{scalar:(t,i)=>`u32(${t}<=${i})`,vector:(t,i)=>`vec4<u32>(${t}<=${i})`},void 0,void 0,9)}}),ro,ao,no,so,oo,uo,Cp=E(()=>{V(),L(),re(),W(),ro=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");let i=0,r=e[i],a=r.dataType,n=r.dims.length;e.forEach((s,o)=>{if(o!==i){if(s.dataType!==a)throw new Error("input tensors should be one type");if(s.dims.length!==n)throw new Error("input tensors should have the same shape");s.dims.forEach((u,l)=>{if(l!==t&&u!==r.dims[l])throw new Error("non concat dimensions must match")})}})},ao=(e,t)=>`
  fn calculateInputIndex(index: u32) -> u32 {
    let sizeInConcatAxis = array<u32, ${e}u>(${t});
    for (var i: u32 = 0u; i < ${e}; i += 1u ) {
      if (index < sizeInConcatAxis[i]) {
        return i;
      }
    }
    return ${e}u;
  }`,no=(e,t)=>{let i=e.length,r=[];for(let a=0;a<i;++a){let n=t.setByOffset("global_idx",e[a].getByIndices("indices"));i===1?r.push(n):a===0?r.push(`if (inputIndex == ${a}u) { ${n} }`):a===i-1?r.push(`else { ${n} }`):r.push(`else if (inputIndex == ${a}) { ${n} }`)}return r.join(`
`)},so=(e,t,i,r)=>{let a=k.size(i),n=new Array(e.length),s=new Array(e.length),o=0,u=[],l=[],d=[{type:12,data:a}];for(let m=0;m<e.length;++m)o+=e[m].dims[t],n[m]=o,l.push(e[m].dims.length),s[m]=S(`input${m}`,r,l[m]),u.push("rank"),d.push({type:12,data:n[m]});for(let m=0;m<e.length;++m)d.push(...M(e[m].dims));d.push(...M(i));let p=O("output",r,i.length),h=p.indicesGet("indices",t),c=Array.from(Array(n.length).keys()).map(m=>`uniforms.sizeInConcatAxis${m}`).join(","),f=m=>`

  ${(()=>{m.registerUniform("outputSize","u32");for(let y=0;y<e.length;y++)m.registerUniform(`sizeInConcatAxis${y}`,"u32");return m.declareVariables(...s,p)})()}

  ${ao(n.length,c)}

  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

    var indices = ${p.offsetToIndices("global_idx")};

    let inputIndex = calculateInputIndex(${h});
    if (inputIndex != 0u) {
      let sizeInConcatAxis = array<u32, ${n.length}u>(${c});
      ${h} -= sizeInConcatAxis[inputIndex - 1u];
    }

    ${no(s,p)}
  }`;return{name:"Concat",shaderCache:{hint:`${t}`,inputDependencies:u},getRunData:()=>({outputs:[{dims:i,dataType:r}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:d}),getShaderSource:f}},oo=(e,t)=>{let i=e.inputs,r=i[0].dims,a=k.normalizeAxis(t.axis,r.length);ro(i,a);let n=r.slice();n[a]=i.reduce((o,u)=>o+(u.dims.length>a?u.dims[a]:0),0);let s=i.filter(o=>k.size(o.dims)>0);e.compute(so(s,a,n,i[0].dataType),{inputs:s})},uo=e=>Q({axis:e.axis})}),Le,We,Ge,Gi,He=E(()=>{V(),L(),Le=(e,t,i="f32")=>{switch(e.activation){case"Relu":return`value = max(value, ${t}(0.0));`;case"Sigmoid":return`value = (${t}(1.0) / (${t}(1.0) + exp(-value)));`;case"Clip":return`value = clamp(value, ${t}(${i}(uniforms.clip_min)), ${t}(${i}(uniforms.clip_max)));`;case"HardSigmoid":return`value = max(${t}(0.0), min(${t}(1.0), ${i}(uniforms.alpha) * value + ${i}(uniforms.beta)));`;case"LeakyRelu":return`value = select(${i}(uniforms.alpha) * value, value, value >= ${t}(0.0));`;case"Tanh":return`let e2x = exp(-2.0 * abs(value));
              value = sign(value) * (1.0 - e2x) / (1.0 + e2x);
        `;case"":return"";default:throw new Error(`Unsupported activation ${e.activation}`)}},We=(e,t)=>{e.activation==="Clip"?t.push({type:1,data:e.clipMax},{type:1,data:e.clipMin}):e.activation==="HardSigmoid"?t.push({type:1,data:e.alpha},{type:1,data:e.beta}):e.activation==="LeakyRelu"&&t.push({type:1,data:e.alpha})},Ge=(e,t)=>{e.activation==="Clip"?t.push({name:"clip_max",type:"f32"},{name:"clip_min",type:"f32"}):e.activation==="HardSigmoid"?t.push({name:"alpha",type:"f32"},{name:"beta",type:"f32"}):e.activation==="LeakyRelu"&&t.push({name:"alpha",type:"f32"})},Gi=e=>{let t=(e==null?void 0:e.activation)||"";if(t==="HardSigmoid"){let[i,r]=(e==null?void 0:e.activation_params)||[.2,.5];return{activation:t,alpha:i,beta:r}}else if(t==="Clip"){let[i,r]=(e==null?void 0:e.activation_params)||[Ca,Ba];return{activation:t,clipMax:r,clipMin:i}}else if(t==="LeakyRelu"){let[i]=(e==null?void 0:e.activation_params)||[.01];return{activation:t,alpha:i}}return{activation:t}}}),se,lo,Hi=E(()=>{se=(e,t)=>{switch(e){case 1:return t;case 2:return`vec2<${t}>`;case 3:return`vec3<${t}>`;case 4:return`vec4<${t}>`;default:throw new Error(`${e}-component is not supported.`)}},lo=e=>`
      ${e?"value = value + getBiasByOutputCoords(coords);":""}
      `}),po,Bp=E(()=>{po=e=>`
fn getIndexFromCoords4D(coords : vec4<i32>, shape : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
      shape.y * shape.z * shape.w, shape.z * shape.w, shape.w, 1));
}
fn getOutputIndexFromCoords(coords : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
    i32(${e}.x), i32(${e}.y), i32(${e}.z), 1));
}
`}),_t,Fi,ji=E(()=>{V(),L(),W(),He(),_t=(e,t,i,r,a)=>{let n=r-i;return`
      ${Array.from({length:i}).map((s,o)=>`
      if (${R(t.shape,o,t.rank)} != 1) {
        ${t.indicesSet(e,o,R(a,o+n,r))}
      } else {
        ${t.indicesSet(e,o,0)}
      }`).join("")}
`},Fi=(e,t,i,r,a=!1,n)=>{let s=e[0].dims,o=e[1].dims,u=s[s.length-2],l=o[o.length-1],d=s[s.length-1],p=ie(l),h=ie(d),c=ie(u),f=k.size(i)/p/c,m=e.length>2,y=r?r.slice(0,-2):i.slice(0,-2),_=[k.size(y),u,l],g=[{type:12,data:f},{type:12,data:u},{type:12,data:l},{type:12,data:d}];We(t,g),g.push(...M(y,s,o)),m&&g.push(...M(e[2].dims)),g.push(...M(_));let w=$=>{let b=Oi("batch_dims",e[0].dataType,y.length),x=S("a",e[0].dataType,s.length,h),v=S("b",e[1].dataType,o.length,p),I=O("output",e[0].dataType,_.length,p),T=ae(I.type.tensor),C=Le(t,I.type.value,T),q=[x,v],D="";if(m){let H=a?p:1;q.push(S("bias",e[2].dataType,e[2].dims.length,H)),D=`${a?`value += bias[col / ${H}];`:`value += ${I.type.value}(bias[row + i]);`}`}let P=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"}];Ge(t,P);let Z=()=>{let H=`var a_data: ${x.type.value};`;for(let U=0;U<h;U++)H+=`
              let b_data${U} = b[(b_offset + (k + ${U}) * uniforms.N + col) / ${p}];`;for(let U=0;U<c;U++){H+=`a_data = a[(a_offset + (row + ${U}) * uniforms.K + k) / ${h}];`;for(let A=0;A<h;A++)H+=`
            values[${U}] = fma(${v.type.value}(a_data${h===1?"":`[${A}]`}), b_data${A}, values[${U}]);
`}return H};return`
  ${$.registerUniforms(P).registerInternalVariables(b).declareVariables(...q,I)}
  ${$.mainStart()}
    ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let col = (global_idx % (uniforms.N / ${p})) * ${p};
    var index1 = global_idx / (uniforms.N / ${p});
    let stride1 = uniforms.M / ${c};
    let row = (index1 % stride1) * ${c};
    let batch = index1 / stride1;

    ${i.length===2?"":`let batch_indices = ${b.offsetToIndices("batch")};`}

    var a_indices: ${x.type.indices};
    ${_t("a_indices",x,x.rank-2,b.rank,"batch_indices")}
    ${x.indicesSet("a_indices",x.rank-2,0)}
    ${x.indicesSet("a_indices",x.rank-1,0)}
    let a_offset = ${x.indicesToOffset("a_indices")};

    var b_indices: ${v.type.indices};
    ${_t("b_indices",v,v.rank-2,b.rank,"batch_indices")}
    ${v.indicesSet("b_indices",v.rank-2,0)}
    ${v.indicesSet("b_indices",v.rank-1,0)}
    let b_offset = ${v.indicesToOffset("b_indices")};
    var values: array<${I.type.value}, ${c}>;
    for (var k: u32 = 0u; k < uniforms.K; k = k + ${h}) {
      ${Z()}
    }
    for (var i = 0u; i < ${c}u; i++) {
      var value = values[i];
      ${D}
      ${C}
      let cur_indices = ${I.type.indices}(batch, row + i, col);
      let offset = ${I.indicesToOffset("cur_indices")};
      ${I.setByOffset(`offset / ${p}`,"value")};
    }
  }
  `};return{name:"MatMulNaive",shaderCache:{hint:`${t.activation};${p};${h};${c};${a}`,inputDependencies:m?["rank","rank","rank"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:n?n(i):i,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:g}),getShaderSource:w}}}),ho,co,Ki,Zi,fo,Qi,mo,qt,Xi=E(()=>{V(),L(),W(),He(),ji(),Hi(),ho=(e,t)=>e?`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          kStart + inputRow,
          globalRowStart / innerElementSize + inputCol${t?", batchIndices":""});
        `:`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          globalRow + innerRow,
          kStart / innerElementSize + inputCol${t?", batchIndices":""});
        `,co=(e,t)=>e?`
        let ACached0 = mm_Asub[k * innerElementSize][localRow];
        let ACached1 = mm_Asub[k * innerElementSize + 1][localRow];
        let ACached2 = mm_Asub[k * innerElementSize + 2][localRow];
        ${t===3?"":"let ACached3 = mm_Asub[k * innerElementSize + 3][localRow];"}
        for (var i = 0; i < rowPerThread; i = i + 1) {
          acc[i] = BCached0 * ACached0[i] + acc[i];
          acc[i] = BCached1 * ACached1[i] + acc[i];
          acc[i] = BCached2 * ACached2[i] + acc[i];
          ${t===3?"":"acc[i] = BCached3 * ACached3[i] + acc[i];"}
        }`:`
        for (var i = 0; i < rowPerThread; i = i + 1) {
          let ACached = mm_Asub[tileRow + i][k];
          acc[i] = BCached0 * ACached.x + acc[i];
          acc[i] = BCached1 * ACached.y + acc[i];
          acc[i] = BCached2 * ACached.z + acc[i];
          ${t===3?"":"acc[i] = BCached3 * ACached.w + acc[i];"}
        }`,Ki=(e,t,i="f32",r,a=!1,n=32,s=!1,o=32)=>{let u=t[1]*e[1],l=t[0]*e[0],d=a?u:n,p=a?n:u,h=d/t[0],c=n/t[1];if(!((a&&h===4&&e[1]===4||!a&&(h===3||h===4))&&d%t[0]===0&&n%t[1]===0&&e[0]===4))throw new Error(`If transposeA ${a} is true, innerElementSize ${h} and workPerThread[1] ${e[1]} must be 4.
      Otherwise, innerElementSize ${h} must be 3 or 4.
  tileAWidth ${d} must be divisible by workgroupSize[0]${t[0]}. tileInner ${n} must be divisible by workgroupSize[1] ${t[1]}. colPerThread ${e[0]} must be 4.`);return`
var<workgroup> mm_Asub: array<array<vec${h}<${i}>, ${d/h}>, ${p}>;
var<workgroup> mm_Bsub: array<array<vec4<${i}>, ${l/e[0]}>, ${n}>;

const rowPerThread = ${e[1]};
const colPerThread = ${e[0]};
const innerElementSize = ${h};
const tileInner = ${n};

@compute @workgroup_size(${t[0]}, ${t[1]}, ${t[2]})
fn main(@builtin(local_invocation_id) localId : vec3<u32>,
        @builtin(global_invocation_id) globalId : vec3<u32>,
        @builtin(workgroup_id) workgroupId : vec3<u32>) {
  let localRow = i32(localId.y);
  let tileRow = localRow * rowPerThread;
  let tileCol = i32(localId.x);

  let globalRow =i32(globalId.y) * rowPerThread;
  let globalCol = i32(globalId.x);
  let batch = ${s?"0":"i32(globalId.z)"};
  ${r?`let batchIndices = ${r.offsetToIndices("u32(batch)")};`:""}
  let globalRowStart = i32(workgroupId.y) * ${u};

  let num_tiles = ${s?`${Math.ceil(o/n)}`:"(uniforms.dim_inner - 1) / tileInner + 1"};
  var kStart = ${s?`i32(globalId.z) * ${o}`:"0"};

  var acc: array<vec4<${i}>, rowPerThread>;

  // Loop over shared dimension.
  let tileRowB = localRow * ${c};
  for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
          let inputRow = tileRow + innerRow;
          let inputCol = tileCol;
          ${ho(a,r)}
      }

      // Load one tile of B into local memory.
      for (var innerRow = 0; innerRow < ${c}; innerRow = innerRow + 1) {
          let inputRow = tileRowB + innerRow;
          let inputCol = tileCol;
          mm_Bsub[inputRow][inputCol] = mm_readB(batch, kStart + inputRow, globalCol${r?", batchIndices":""});
      }
      kStart = kStart + tileInner;
      workgroupBarrier();

      // Compute acc values for a single thread.
      for (var k = 0; k < tileInner / innerElementSize; k = k + 1) {
          let BCached0 = mm_Bsub[k * innerElementSize][tileCol];
          let BCached1 = mm_Bsub[k * innerElementSize + 1][tileCol];
          let BCached2 = mm_Bsub[k * innerElementSize + 2][tileCol];
          ${h===3?"":"let BCached3 = mm_Bsub[k * innerElementSize + 3][tileCol];"}

          ${co(a,h)}
      }

      workgroupBarrier();
  }

  for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      mm_write(batch, globalRow + innerRow, globalCol, acc[innerRow]);
  }
}`},Zi=(e,t)=>e?`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              kStart + inputRow,
              globalRowStart + inputCol${t?", batchIndices":""});
            `:`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              globalRowStart + inputRow,
              kStart + inputCol${t?", batchIndices":""});
            `,fo=e=>e?"let ACached = mm_Asub[k][tileRow + innerRow];":"let ACached = mm_Asub[tileRow + innerRow][k];",Qi=(e,t,i="f32",r,a=!1,n=32,s=!1,o=32,u=!1)=>{let l=e[1]*t[1],d=e[0]*t[0],p=a?l:n,h=a?n:l;if(!(h%t[1]===0&&p%t[0]===0&&n%t[1]===0))throw new Error(`tileAHight ${h} must be divisible by workgroupSize[1]${t[1]}, tileAWidth ${p} must be divisible by workgroupSize[0]${t[0]}, tileInner ${n} must be divisible by workgroupSize[1]${t[1]}`);let c=h/t[1],f=p/t[0],m=n/t[1],y=u?`
    let localRow = i32(localId.y);
    let localCol = i32(localId.x);
    let globalRowStart = i32(workgroupId.y) * ${l};
    let globalColStart = i32(workgroupId.x) * ${d};

    // Loop over shared dimension.
    for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var inputRow = localRow; inputRow < ${h}; inputRow = inputRow + ${t[1]}) {
        for (var inputCol = localCol; inputCol < ${p}; inputCol = inputCol + ${t[0]}) {
          ${Zi(a,r)}
        }
      }
      // Load one tile of B into local memory.
      for (var inputRow = localRow; inputRow < ${n}; inputRow = inputRow + ${t[1]}) {
            for (var inputCol = localCol; inputCol < ${d}; inputCol = inputCol + ${t[0]}) {
          mm_Bsub[inputRow][inputCol] = mm_readB(batch,
            kStart + inputRow,
            globalColStart + inputCol${r?", batchIndices":""});
        }
      }
      kStart = kStart + tileInner;
      workgroupBarrier();

      // Compute acc values for a single thread.
      var BCached : array<${i}, colPerThread>;
      for (var k = 0; k < tileInner; k = k + 1) {
        for (var inner = 0; inner < colPerThread; inner = inner + 1) {
          BCached[inner] = mm_Bsub[k][localCol + inner * ${t[0]}];
        }
        for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
          let ACached = ${a?`mm_Asub[k][localRow + innerRow * ${t[1]}];`:`mm_Asub[localRow + innerRow * ${t[1]}][k];`}
          for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
            acc[innerRow][innerCol] = acc[innerRow][innerCol] +
                ACached * BCached[innerCol];
          }
        }
      }
      workgroupBarrier();
    }
    for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      let gRow = globalRowStart + localRow + innerRow * ${t[1]};
      for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
        let gCol = globalColStart + localCol + innerCol * ${t[0]};
        mm_write(batch, gRow, gCol, acc[innerRow][innerCol]);
      }
    }
    `:`
let tileRow = i32(localId.y) * rowPerThread;
let tileCol = i32(localId.x) * colPerThread;

let globalRow = i32(globalId.y) * rowPerThread;
let globalCol = i32(globalId.x) * colPerThread;
let globalRowStart = i32(workgroupId.y) * ${l};

let tileRowA = i32(localId.y) * ${c};
let tileColA = i32(localId.x) * ${f};
let tileRowB = i32(localId.y) * ${m};
// Loop over shared dimension.
for (var t = 0; t < num_tiles; t = t + 1) {
  // Load one tile of A into local memory.
  for (var innerRow = 0; innerRow < ${c}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < ${f}; innerCol = innerCol + 1) {
      let inputRow = tileRowA + innerRow;
      let inputCol = tileColA + innerCol;
      ${Zi(a,r)}
    }
  }

  // Load one tile of B into local memory.
  for (var innerRow = 0; innerRow < ${m}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
      let inputRow = tileRowB + innerRow;
      let inputCol = tileCol + innerCol;
      mm_Bsub[inputRow][inputCol] = mm_readB(batch,
        kStart + inputRow,
        globalCol + innerCol${r?", batchIndices":""});
    }
  }
  kStart = kStart + tileInner;
  workgroupBarrier();

  // Compute acc values for a single thread.
  var BCached : array<${i}, colPerThread>;
  for (var k = 0; k < tileInner; k = k + 1) {
    for (var inner = 0; inner < colPerThread; inner = inner + 1) {
      BCached[inner] = mm_Bsub[k][tileCol + inner];
    }

    for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      ${fo(a)}
      for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
        acc[innerRow][innerCol] = acc[innerRow][innerCol] + ACached * BCached[innerCol];
      }
    }
  }

  workgroupBarrier();
}

for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
  for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
    mm_write(batch, globalRow + innerRow, globalCol + innerCol,
        acc[innerRow][innerCol]);
  }
}
`;return`
  var<workgroup> mm_Asub : array<array<${i}, ${p}>, ${h}>;
  var<workgroup> mm_Bsub : array<array<${i}, ${d}>, ${n}>;
  const rowPerThread = ${e[1]};
  const colPerThread = ${e[0]};
  const tileInner = ${n};

@compute @workgroup_size(${t[0]}, ${t[1]}, ${t[2]})
fn main(@builtin(local_invocation_id) localId : vec3<u32>,
        @builtin(global_invocation_id) globalId : vec3<u32>,
        @builtin(workgroup_id) workgroupId : vec3<u32>) {
    let batch = ${s?"0":"i32(globalId.z)"};
    ${r?`let batchIndices = ${r.offsetToIndices("u32(batch)")};`:""}
    let num_tiles = ${s?`${Math.ceil(o/n)}`:"(uniforms.dim_inner - 1) / tileInner + 1"};
    var kStart = ${s?`i32(globalId.z) * ${o}`:"0"};

    var acc : array<array<${i}, colPerThread>, rowPerThread>;
    ${y}
  }
`},mo=(e,t,i,r,a=!1)=>{let[n,s,o,u]=r,l=ae(r[0].type.tensor);return`
    fn mm_readA(batch: i32, row: i32, colIn: i32, batchIndices: ${n.type.indices}) -> ${se(e,l)} {
      var value = ${se(e,l)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_a_outer && col < uniforms.dim_inner)
      {
        var aIndices: ${s.type.indices};
        ${_t("aIndices",s,s.rank-2,n.rank,"batchIndices")}
        ${s.indicesSet("aIndices",s.rank-2,"u32(row)")}
        ${s.indicesSet("aIndices",s.rank-1,"u32(colIn)")}
        value = ${s.getByIndices("aIndices")};
      }
      return value;
    }

    fn mm_readB(batch: i32, row: i32, colIn: i32, batchIndices: ${n.type.indices}) -> ${se(e,l)} {
      var value = ${se(e,l)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_inner && col < uniforms.dim_b_outer)
      {
        var bIndices: ${o.type.indices};
        ${_t("bIndices",o,o.rank-2,n.rank,"batchIndices")}
        ${o.indicesSet("bIndices",o.rank-2,"u32(row)")}
        ${o.indicesSet("bIndices",o.rank-1,"u32(colIn)")}
        value = ${o.getByIndices("bIndices")};
      }
      return value;
    }

    fn mm_write(batch: i32, row: i32, colIn: i32, valueIn: ${se(e,l)}) {
      let col = colIn * ${e};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer) {
        var value = valueIn;
        let coords = vec3<i32>(batch, row, colIn);
        ${t?`value = value + ${a?"bias[colIn]":`${se(e,l)}(bias[row])`};`:""}
        ${i}
        ${u.setByIndices("vec3<u32>(coords)","value")}
      }
    }
    `},qt=(e,t,i,r,a=!1,n)=>{let s=e[0].dims,o=e[1].dims,u=s.slice(0,-2),l=o.slice(0,-2),d=r?r.slice(0,-2):i.slice(0,-2),p=k.size(d),h=s[s.length-2],c=s[s.length-1],f=o[o.length-1],m=c%4===0&&f%4===0,y=h<=8?[4,1,1]:[4,4,1],_=[8,8,1],g=[Math.ceil(f/_[0]/y[0]),Math.ceil(h/_[1]/y[1]),Math.ceil(p/_[2]/y[2])],w=m?4:1,$=[...u,h,c/w],b=$.length,x=[...l,c,f/w],v=x.length,I=[p,h,f/w],T=[{type:6,data:h},{type:6,data:f},{type:6,data:c}];We(t,T),T.push(...M(d,$,x));let C=["rank","rank"],q=e.length>2;q&&(T.push(...M(e[2].dims)),C.push("rank")),T.push(...M(I));let D=P=>{let Z=d.length,H=Oi("batchDims",e[0].dataType,Z,1),U=ae(e[0].dataType),A=S("a",e[0].dataType,b,w),J=S("b",e[1].dataType,v,w),G=O("result",e[0].dataType,I.length,w),j=[A,J];if(q){let pe=a?w:1;j.push(S("bias",e[2].dataType,e[2].dims.length,pe))}let z=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"}];Ge(t,z);let B=ae(G.type.tensor),N=Le(t,G.type.value,B),X=mo(w,q,N,[H,A,J,G],a);return`
  ${P.registerUniforms(z).registerInternalVariables(H).declareVariables(...j,G)}
  ${X}
  ${m?Ki(y,_,U,H):Qi(y,_,U,H)}
                   `};return{name:"MatMul",shaderCache:{hint:`${y};${t.activation};${m};${a}`,inputDependencies:C},getRunData:()=>({outputs:[{dims:n?n(i):i,dataType:e[0].dataType}],dispatchGroup:{x:g[0],y:g[1],z:g[2]},programUniforms:T}),getShaderSource:D}}}),go,_o,Ap=E(()=>{V(),Ce(),W(),He(),Hi(),Bp(),Xi(),go=(e,t,i,r,a=!1,n,s=4,o=4,u=4,l="f32")=>{let d=T=>{switch(T){case 1:return"resData = x[xIndex];";case 3:return`resData = vec3<${l}>(x[xIndex], x[xIndex + 1], x[xIndex + 2]);`;case 4:return"resData = x[xIndex / 4];";default:throw new Error(`innerElementSize ${T} is not supported.`)}},p=T=>{switch(T){case 1:return"return w[row * i32(uniforms.w_shape[3]) + colIn];";case 4:return"return w[row * i32(uniforms.w_shape[3]) / 4 + colIn];";default:throw new Error(`innerElementSize ${T} is not supported.`)}},h=e?`
    let coord = vec4<i32>(batch, xRow, xCol, xCh);
    `:`
    let coord = vec4<i32>(batch, xCh, xRow, xCol);
    `,c=e?`
    let coords = vec4<i32>(
      batch,
      row / outWidth,
      row % outWidth,
      col);
    `:`
    let coords = vec4<i32>(
      batch,
      row,
      col / outWidth,
      col % outWidth);
    `,f=e?"i32(uniforms.x_shape[1])":"i32(uniforms.x_shape[2])",m=e?"i32(uniforms.x_shape[2])":"i32(uniforms.x_shape[3])",y=e?"row":"col",_=e?"col":"row",g=`
    let inChannels = i32(uniforms.w_shape[2]);
    let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
    let outRow = ${y} / outWidth;
    let outCol = ${y} % outWidth;

    let WRow = ${_} / (i32(uniforms.w_shape[1]) * inChannels);
    let WCol = ${_} / inChannels % i32(uniforms.w_shape[1]);
    let xRow = outRow * uniforms.stride[0] + uniforms.dilation[0] * WRow - uniforms.pad[0];
    let xCol = outCol * uniforms.stride[1] + uniforms.dilation[1] * WCol - uniforms.pad[1];
    let xCh = ${_} % inChannels;
    var resData = ${se(s,l)}(0.0);
    // The bounds checking is always needed since we use it to pad zero for
    // the 'same' padding type.
    if (xRow >= 0 && xRow < ${f} && xCol >= 0 && xCol < ${m}) {
      ${h}
      let xIndex = getIndexFromCoords4D(coord, vec4<i32>(uniforms.x_shape));
      ${d(s)}
    }
    return resData;`,w=e?t&&r?`
    let col = colIn * ${s};
    ${g}`:`
    let col = colIn * ${s};
    if (row < uniforms.dim_a_outer && col < uniforms.dim_inner) {
      ${g}
    }
    return ${se(s,l)}(0.0);`:r&&i?`
    let col = colIn * ${s};
    ${g}`:`
    let col = colIn * ${s};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${g}
    }
    return ${se(s,l)}(0.0);`,$=e?r&&i?p(o):`
    let col = colIn * ${o};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${p(o)}
    }
    return ${se(o,l)}(0.0);`:`
    let col = colIn * ${o};
    if (row < uniforms.dim_inner && col < uniforms.dim_a_outer) {
      ${p(o)}
    }
    return ${se(o,l)}(0.0);`,b=se(u,l),x=se(e?s:o,l),v=se(e?o:s,l),I=Le(n,b,l);return`
    fn mm_readA(batch: i32, row : i32, colIn : i32) -> ${x} {
      ${e?w:$}
    }

    fn mm_readB(batch: i32, row : i32, colIn : i32) -> ${v} {
      ${e?$:w}
    }

    fn mm_write(batch: i32, row : i32, colIn : i32, valueIn : ${b}) {
      let col = colIn * ${u};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer)
      {
      var value = valueIn;
      let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
      ${c}
      ${lo(a)}
      ${I}
      setOutputAtCoords(coords[0], coords[1], coords[2], coords[3], value);
      }
    }`},_o=(e,t,i,r,a,n,s,o,u)=>{let l=t.format==="NHWC",d=l?e[0].dims[3]:e[0].dims[1],p=i[0],h=l?i[2]:i[3],c=l?i[1]:i[2],f=l?i[3]:i[1],m=l&&(d%4===0||d%3===0)&&f%4===0,y=l?f:h*c,_=l?h*c:f,g=[8,8,1],w=r<=8?[4,1,1]:[4,4,1],$=[Math.ceil(y/g[0]/w[0]),Math.ceil(_/g[1]/w[1]),Math.ceil(p/g[2]/w[2])];F("verbose",()=>`[conv2d_mm_webgpu] dispatch = ${$}`);let b=m?l&&d%4!==0?3:4:1,x=g[1]*w[1],v=g[0]*w[0],I=Math.max(g[0]*b,g[1]),T=r%x===0,C=a%v===0,q=n%I===0,D=m?[b,4,4]:[1,1,1],P=[{type:6,data:r},{type:6,data:a},{type:6,data:n},{type:6,data:[t.pads[0],t.pads[1]]},{type:6,data:t.strides},{type:6,data:t.dilations}];We(t,P),P.push(...M(e[0].dims,e[1].dims));let Z=["rank","rank"];s&&(P.push(...M(e[2].dims)),Z.push("rank")),P.push(...M(i));let H=U=>{let A=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"},{name:"pad",type:"i32",length:2},{name:"stride",type:"i32",length:2},{name:"dilation",type:"i32",length:2}];Ge(t,A);let J=m?4:1,G=ae(e[0].dataType),j=`
      fn setOutputAtIndex(flatIndex : i32, value : ${m?`vec4<${G}>`:G}) {
        result[flatIndex] = ${m?`vec4<${G}>`:G}(value);
      }
      fn setOutputAtCoords(d0 : i32, d1 : i32, d2 : i32, d3 : i32, value : ${m?`vec4<${G}>`:G}) {
        let flatIndex = getOutputIndexFromCoords(vec4<i32>(d0, d1, d2, d3));
        setOutputAtIndex(flatIndex ${m?"/ 4":""}, value);
      }`,z=S("x",e[0].dataType,e[0].dims.length,b===3?1:b),B=S("w",e[1].dataType,e[1].dims.length,J),N=[z,B],X=O("result",e[0].dataType,i.length,J);if(s){let pe=S("bias",e[2].dataType,e[2].dims.length,J);N.push(pe),j+=`
        fn getBiasByOutputCoords(coords : vec4<i32>) -> ${m?`vec4<${G}>`:G} {
          return bias[coords.${l?"w":"y"}${m?"/ 4":""}];
        }`}return`
        ${po("uniforms.result_strides")}
        //struct Uniforms { xShape : vec4<i32>, wShape : vec4<i32>, outShape : vec4<i32>,
        //  outShapeStrides: vec3<i32>, filterDims : vec2<i32>, pad : vec2<i32>, stride : vec2<i32>,
        //  dilation : vec2<i32>, dimAOuter : i32, dimBOuter : i32, dimInner : i32 };
        ${U.registerUniforms(A).declareVariables(...N,X)}
        ${j}
        ${go(l,T,C,q,s,t,D[0],D[1],D[2],G)}
        ${m?Ki(w,g,G,void 0,!l,I):Qi(w,g,G,void 0,!l,I,!1,void 0,o)}`};return{name:"Conv2DMatMul",shaderCache:{hint:`${t.cacheKey};${b};${m};${T};${C};${q};${x};${v};${I}`,inputDependencies:Z},getRunData:()=>({outputs:[{dims:u?u(i):i,dataType:e[0].dataType}],dispatchGroup:{x:$[0],y:$[1],z:$[2]},programUniforms:P}),getShaderSource:H}}}),yo,Yi,yt,$o,Ji,wo,bo,vo,Op=E(()=>{V(),Ce(),L(),W(),He(),Hi(),yo=e=>{let t=1;for(let i=0;i<e.length;i++)t*=e[i];return t},Yi=e=>typeof e=="number"?[e,e,e]:e,yt=(e,t)=>t<=1?e:e+(e-1)*(t-1),$o=(e,t,i,r=1)=>{let a=yt(t,r);return Math.floor((e[0]*(i-1)-i+a)/2)},Ji=(e,t,i,r,a)=>{a==null&&(a=$o(e,t[0],r[0]));let n=[0,0,0,i];for(let s=0;s<3;s++)e[s]+2*a>=t[s]&&(n[s]=Math.trunc((e[s]-t[s]+2*a)/r[s]+1));return n},wo=(e,t,i,r,a,n,s,o,u,l)=>{let d,p,h,c;if(e==="VALID"&&(e=0),typeof e=="number"){d={top:e,bottom:e,left:e,right:e,front:e,back:e};let f=Ji([t,i,r,1],[o,u,l],1,[a,n,s],e);p=f[0],h=f[1],c=f[2]}else if(Array.isArray(e)){if(!e.every((m,y,_)=>m===_[0]))throw Error(`Unsupported padding parameter: ${e}`);d={top:e[0],bottom:e[1],left:e[2],right:e[3],front:e[4],back:e[5]};let f=Ji([t,i,r,1],[o,u,l],1,[a,n,s],e[0]);p=f[0],h=f[1],c=f[2]}else if(e==="SAME_UPPER"){p=Math.ceil(t/a),h=Math.ceil(i/n),c=Math.ceil(r/s);let f=(p-1)*a+o-t,m=(h-1)*n+u-i,y=(c-1)*s+l-r,_=Math.floor(f/2),g=f-_,w=Math.floor(m/2),$=m-w,b=Math.floor(y/2),x=y-b;d={top:w,bottom:$,left:b,right:x,front:_,back:g}}else throw Error(`Unknown padding parameter: ${e}`);return{padInfo:d,outDepth:p,outHeight:h,outWidth:c}},bo=(e,t,i,r,a,n=!1,s="channelsLast")=>{let o,u,l,d,p;if(s==="channelsLast")[o,u,l,d,p]=e;else if(s==="channelsFirst")[o,p,u,l,d]=e;else throw new Error(`Unknown dataFormat ${s}`);let[h,,c,f,m]=t,[y,_,g]=Yi(i),[w,$,b]=Yi(r),x=yt(c,w),v=yt(f,$),I=yt(m,b),{padInfo:T,outDepth:C,outHeight:q,outWidth:D}=wo(a,u,l,d,y,_,g,x,v,I),P=n?h*p:h,Z=[0,0,0,0,0];return s==="channelsFirst"?Z=[o,P,C,q,D]:s==="channelsLast"&&(Z=[o,C,q,D,P]),{batchSize:o,dataFormat:s,inDepth:u,inHeight:l,inWidth:d,inChannels:p,outDepth:C,outHeight:q,outWidth:D,outChannels:P,padInfo:T,strideDepth:y,strideHeight:_,strideWidth:g,filterDepth:c,filterHeight:f,filterWidth:m,effectiveFilterDepth:x,effectiveFilterHeight:v,effectiveFilterWidth:I,dilationDepth:w,dilationHeight:$,dilationWidth:b,inShape:e,outShape:Z,filterShape:t}},vo=(e,t,i,r,a,n)=>{let s=n==="channelsLast";s?e[0].dims[3]:e[0].dims[1];let o=[64,1,1],u={x:i.map((y,_)=>_)},l=[Math.ceil(yo(u.x.map(y=>i[y]))/o[0]),1,1];F("verbose",()=>`[conv3d_naive_webgpu] dispatch = ${l}`);let d=1,p=k.size(i),h=[{type:12,data:p},{type:12,data:r},{type:12,data:a},{type:12,data:t.strides},{type:12,data:t.dilations}];We(t,h),h.push(...M(e[0].dims,e[1].dims));let c=["rank","rank"],f=e.length===3;f&&(h.push(...M(e[2].dims)),c.push("rank")),h.push(...M(i));let m=y=>{let _=[{name:"output_size",type:"u32"},{name:"filter_dims",type:"u32",length:r.length},{name:"pads",type:"u32",length:a.length},{name:"strides",type:"u32",length:t.strides.length},{name:"dilations",type:"u32",length:t.dilations.length}];Ge(t,_);let g=1,w=ae(e[0].dataType),$=S("x",e[0].dataType,e[0].dims.length,d),b=S("W",e[1].dataType,e[1].dims.length,g),x=[$,b],v=O("result",e[0].dataType,i.length,g),I="";if(f){let q=S("bias",e[2].dataType,e[2].dims.length,g);x.push(q),I+=`
        fn getBiasByOutputCoords(coords : array<u32, 5>) -> ${w} {
          return bias[${s?R("coords",4,5):R("coords",1,5)}];
        }`}let T=se(d,w),C=Le(t,T,w);return`
            ${I}
            fn getX(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${$.getByIndices("aIndices")};
            }
            fn getW(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${b.getByIndices("aIndices")};
            }
          ${y.registerUniforms(_).declareVariables(...x,v)}
          ${y.mainStart()}
          ${y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
              let coords = ${v.offsetToIndices("global_idx")};
              let batch = ${R("coords",0,$.rank)};
              let d2 = ${s?R("coords",$.rank-1,$.rank):R("coords",1,$.rank)};
              let xFRCCorner = vec3<u32>(${s?R("coords",1,$.rank):R("coords",2,$.rank)},
              ${s?R("coords",2,$.rank):R("coords",3,$.rank)},
              ${s?R("coords",3,$.rank):R("coords",4,$.rank)}) * uniforms.strides - uniforms.pads;
              let xFCorner = xFRCCorner.x;
              let xRCorner = xFRCCorner.y;
              let xCCorner = xFRCCorner.z;
              let xShapeY = ${s?R("uniforms.x_shape",1,$.rank):R("uniforms.x_shape",2,$.rank)};
              let xShapeZ = ${s?R("uniforms.x_shape",2,$.rank):R("uniforms.x_shape",3,$.rank)};
              let xShapeW = ${s?R("uniforms.x_shape",3,$.rank):R("uniforms.x_shape",4,$.rank)};
              let xShapeU = ${s?R("uniforms.x_shape",4,$.rank):R("uniforms.x_shape",1,$.rank)};
              let inputDepthNearestVec4 = (xShapeU / 4) * 4;
              let inputDepthVec4Remainder = xShapeU % 4;

              var value = 0.0;
              for (var wF = 0u; wF < uniforms.filter_dims[0]; wF++) {
                let xF = xFCorner + wF * uniforms.dilations[0];
                if (xF < 0 || xF >= xShapeY) {
                  continue;
                }

                for (var wR = 0u; wR < uniforms.filter_dims[1]; wR++) {
                  let xR = xRCorner + wR * uniforms.dilations[1];
                  if (xR < 0 || xR >= xShapeZ) {
                    continue;
                  }

                  for (var wC = 0u; wC < uniforms.filter_dims[2]; wC++) {
                    let xC = xCCorner + wC * uniforms.dilations[2];
                    if (xC < 0 || xC >= xShapeW) {
                      continue;
                    }

                    for (var d1 = 0u; d1 < inputDepthNearestVec4; d1 += 4) {
                      ${s?`let xValues = vec4<f32>(
                               getX(batch, xF, xR, xC, d1),
                               getX(batch, xF, xR, xC, d1 + 1),
                               getX(batch, xF, xR, xC, d1 + 2),
                               getX(batch, xF, xR, xC, d1 + 3));
                            `:`let xValues = vec4<f32>(
                               getX(batch, d1, xF, xR, xC),
                               getX(batch, d1 + 1, xF, xR, xC),
                               getX(batch, d1 + 2, xF, xR, xC),
                               getX(batch, d1 + 3, xF, xR, xC));
                            `}
                            let wValues = vec4<f32>(
                              getW(d2, d1, wF, wR, wC),
                              getW(d2, d1 + 1, wF, wR, wC),
                              getW(d2, d1 + 2, wF, wR, wC),
                              getW(d2, d1 + 3, wF, wR, wC));
                      value += dot(xValues, wValues);
                    }
                    if (inputDepthVec4Remainder == 1) {
                        ${s?`value += getX(batch, xF, xR, xC, inputDepthNearestVec4)
                          * getW(d2, inputDepthNearestVec4, wF, wR, wC);`:`value += getX(batch, inputDepthNearestVec4, xF, xR, xC)
                          * getW(d2, inputDepthNearestVec4, wF, wR, wC);`}
                    } else if (inputDepthVec4Remainder == 2) {
                      ${s?`let xValues = vec2<f32>(
                        getX(batch, xF, xR, xC, inputDepthNearestVec4),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 1));
                      `:`let xValues = vec2<f32>(
                        getX(batch, inputDepthNearestVec4, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 1, xF, xR, xC));
                    `}
                    let wValues = vec2<f32>(
                      getW(d2, inputDepthNearestVec4, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 1, wF, wR, wC));
                      value += dot(xValues, wValues);
                    } else if (inputDepthVec4Remainder == 3) {
                      ${s?`let xValues = vec3<f32>(
                        getX(batch, xF, xR, xC, inputDepthNearestVec4),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 1),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 2));
                      `:`let xValues = vec3<f32>(
                        getX(batch, inputDepthNearestVec4, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 1, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 2, xF, xR, xC));
                    `}
                    let wValues = vec3<f32>(
                      getW(d2, inputDepthNearestVec4, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 1, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 2, wF, wR, wC));
                      value += dot(xValues, wValues);
                    }
                  }
                }
              }
              ${f?"value = value + getBiasByOutputCoords(coords)":""};
              ${C}
              result[global_idx] = f32(value);
          }`};return{name:"Conv3DNaive",shaderCache:{hint:`${t.cacheKey};${s};${d};${f}`,inputDependencies:c},getRunData:()=>({outputs:[{dims:i,dataType:e[0].dataType}],dispatchGroup:{x:l[0],y:l[1],z:l[2]},programUniforms:h}),getShaderSource:m}}}),xo,ko,Rp=E(()=>{V(),L(),W(),He(),xo=(e,t,i,r)=>{let a=e.length>2,n=a?"value += b[output_channel];":"",s=e[0].dims,o=e[1].dims,u=t.format==="NHWC",l=u?i[3]:i[1],d=l/t.group,p=u&&d>=4?ie(l):1,h=k.size(i)/p,c=[{type:12,data:h},{type:12,data:t.dilations},{type:12,data:[t.strides[0],t.strides[1]]},{type:12,data:[t.pads[0],t.pads[1]]},{type:12,data:d}];We(t,c),c.push(...M(s,[o[0],o[1],o[2],o[3]/p]));let f=a?["rank","rank","rank"]:["rank","rank"];c.push(...M([i[0],i[1],i[2],i[3]/p]));let m=y=>{let _=O("output",e[0].dataType,i.length,p),g=ae(_.type.tensor),w=Le(t,_.type.value,g),$=S("x",e[0].dataType,s.length),b=S("w",e[1].dataType,o.length,p),x=[$,b];a&&x.push(S("b",e[2].dataType,e[2].dims,p));let v=[{name:"output_size",type:"u32"},{name:"dilations",type:"u32",length:t.dilations.length},{name:"strides",type:"u32",length:2},{name:"pads",type:"u32",length:2},{name:"output_channels_per_group",type:"u32"}];Ge(t,v);let I=u?`
      for (var wHeight: u32 = 0u; wHeight < uniforms.w_shape[0]; wHeight++) {
        let xHeight = xRCCorner.x + wHeight * uniforms.dilations[0];

        if (xHeight < 0u || xHeight >= uniforms.x_shape[1]) {
          continue;
        }

        for (var wWidth: u32 = 0u; wWidth < uniforms.w_shape[1]; wWidth++) {
          let xWidth = xRCCorner.y + wWidth * uniforms.dilations[1];
          if (xWidth < 0u || xWidth >= uniforms.x_shape[2]) {
            continue;
          }

          for (var wInChannel: u32 = 0u; wInChannel < uniforms.w_shape[2]; wInChannel++) {
            let input_channel = in_channel_offset + wInChannel;
            let xVal = ${$.get("batch","xHeight","xWidth","input_channel")};
            let wVal = ${b.get("wHeight","wWidth","wInChannel","output_channel")};
            value += xVal * wVal;
          }
        }
      }
      `:`
      for (var wInChannel: u32 = 0u; wInChannel < uniforms.w_shape[1]; wInChannel++) {
        let input_channel = in_channel_offset + wInChannel;
        for (var wHeight: u32 = 0u; wHeight < uniforms.w_shape[2]; wHeight++) {
          let xHeight = xRCCorner.x + wHeight * uniforms.dilations[0];

          if (xHeight < 0u || xHeight >= uniforms.x_shape[2]) {
            continue;
          }

          for (var wWidth: u32 = 0u; wWidth < uniforms.w_shape[3]; wWidth++) {
            let xWidth = xRCCorner.y + wWidth * uniforms.dilations[1];
            if (xWidth < 0u || xWidth >= uniforms.x_shape[3]) {
              continue;
            }

            let xVal = ${$.get("batch","input_channel","xHeight","xWidth")};
            let wVal = ${b.get("output_channel","wInChannel","wHeight","wWidth")};
            value += xVal * wVal;
          }
        }
      }
      `;return`
  ${y.registerUniforms(v).declareVariables(...x,_)}

  ${y.mainStart()}
    ${y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let outputIndices = ${_.offsetToIndices("global_idx")};
    let batch: u32 = outputIndices[0];
    let output_channel: u32 = outputIndices[${u?3:1}];
    let xRCCorner: vec2<u32> = vec2<u32>(outputIndices[${u?1:2}], outputIndices[${u?2:3}]) * uniforms.strides - uniforms.pads;
    let group_id: u32 = output_channel * ${p} / uniforms.output_channels_per_group;
    var in_channel_offset = group_id * uniforms.w_shape[${u?2:1}];

    var value: ${_.type.value} = ${_.type.value}(0);
    ${I}
    ${n}
    ${w}
    ${_.setByOffset("global_idx","value")}
  }`};return{name:"GroupedConv",shaderCache:{hint:`${t.cacheKey}_${p}`,inputDependencies:f},getRunData:()=>({outputs:[{dims:r?r(i):i,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(h/64)},programUniforms:c}),getShaderSource:m}},ko=(e,t,i,r)=>{let a=e.length>2,n=ie(i[3]),s=ie(i[2]),o=k.size(i)/n/s,u=[e[0].dims[0],e[0].dims[1],e[0].dims[2],e[0].dims[3]/n],l=[e[1].dims[0],e[1].dims[1],e[1].dims[2],e[1].dims[3]/n],d=[i[0],i[1],i[2],i[3]/n],p=[{type:12,data:o},{type:6,data:[t.strides[0],t.strides[1]]},{type:6,data:[t.pads[0],t.pads[1]]}];We(t,p),p.push(...M(u,l,d));let h=(s-1)*t.strides[1]+l[1],c=f=>{let m=O("output",e[0].dataType,d.length,n),y=ae(m.type.tensor),_=Le(t,m.type.value,y),g=S("x",e[0].dataType,u.length,n),w=S("w",e[1].dataType,l.length,n),$=[g,w];a&&$.push(S("b",e[2].dataType,e[2].dims,n));let b=a?"value += b[output_channel];":"",x=[{name:"output_size",type:"u32"},{name:"strides",type:"i32",length:2},{name:"pads",type:"i32",length:2}];return Ge(t,x),`
  ${f.registerUniforms(x).declareVariables(...$,m)}
  ${f.mainStart()}
    ${f.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let width0 = uniforms.output_shape[3];
    let output_channel = global_idx % width0;
    var index1 = global_idx / width0;
    let width1 = uniforms.output_shape[2] / ${s}u;
    let col = (index1 % width1) * ${s}u;
    index1 = index1 / width1;
    let row = index1 % uniforms.output_shape[1];
    let batch = index1 / uniforms.output_shape[1];

    let x_corner = vec2<i32>(i32(row), i32(col)) * uniforms.strides - uniforms.pads;

    var x_vals: array<${g.type.value}, ${h}>;
    var values: array<${m.type.value}, ${s}>;
    let input_channel = output_channel;
    // Use constant instead of uniform can give better performance for w's height/width.
    for (var w_height: u32 = 0u; w_height < ${l[0]}; w_height++) {
      let x_height = x_corner.x + i32(w_height);
      if (x_height >= 0 && u32(x_height) < uniforms.x_shape[1]) {
        for (var i = 0; i < ${h}; i++) {
          let x_width = x_corner.y + i;
          if (x_width >= 0 && u32(x_width) < uniforms.x_shape[2]) {
            x_vals[i] = ${g.get("batch","u32(x_height)","u32(x_width)","input_channel")};
          } else {
            x_vals[i] = ${g.type.value}(0);
          }
        }
        for (var w_width: u32 = 0u; w_width < ${l[1]}; w_width++) {
          let w_val = ${w.get("w_height","w_width","0","output_channel")};
          for (var i = 0u; i < ${s}u; i++) {
            values[i] = fma(x_vals[i * u32(uniforms.strides[1]) + w_width], w_val, values[i]);
          }
        }
      }
    }

    for (var i = 0u; i < ${s}u; i++) {
      var value = values[i];
      ${b}
      ${_}
      ${m.set("batch","row","col + i","output_channel","value")};
    }
  }`};return{name:"GroupedConv-Vectorize",shaderCache:{hint:`${t.cacheKey};${n};${s};${h};${l[0]};${l[1]}`,inputDependencies:a?["rank","rank","type"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:r?r(i):i,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:p}),getShaderSource:c}}}),Io,Nt,So,Vt,er,tr,To,zo,ir,Dp=E(()=>{L(),Ap(),Op(),Xi(),Rp(),He(),ji(),Re(),Io=(e,t,i,r,a,n)=>{let s=e[0],o=e.slice(n?1:2,n?3:4),u=o.length,l=t[0],d=t.slice(2).map((h,c)=>h+(h-1)*(i[c]-1)),p=o.map((h,c)=>h+r[c]+r[c+u]).map((h,c)=>Math.floor((h-d[c]+a[c])/a[c]));return p.splice(0,0,s),p.splice(n?3:1,0,l),p},Nt=[2,3,1,0],So=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length>5)throw new Error("greater than 5D is not supported");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let i=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],r=e[1].dims[1]*t.group;if(i!==r)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");if(e.length===3&&(e[2].dims.length!==1||e[1].dims[0]!==e[2].dims[0]))throw new Error("invalid bias");let a=e[0].dims.length-2;if(t.dilations.length!==a)throw new Error(`dilations should be ${a}D`);if(t.strides.length!==a)throw new Error(`strides should be ${a}D`);if(t.pads.length!==a*2)throw new Error(`pads should be ${a*2}D`);if(t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape")},Vt=(e,t)=>{let i=e.kernelShape.slice();i.length<t[1].dims.length-2&&i.push(...Array(t[1].dims.length-2-i.length).fill(0));for(let n=2;n<t[1].dims.length;++n)i[n-2]===0&&(i[n-2]=t[1].dims[n]);let r=e.pads.slice();Bt.adjustPadsBasedOnAutoPad(t[0].dims,e.strides,e.dilations,i,r,e.format==="NHWC",e.autoPad);let a=Object.assign({},e);return Object.assign(a,{kernelShape:i,pads:r}),a},er=e=>{let t=Gi(e),i=e.format,r=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],a=e.dilations,n=e.group,s=e.kernel_shape,o=e.pads,u=e.strides,l=e.w_is_const();return{autoPad:r,format:i,dilations:a,group:n,kernelShape:s,pads:o,strides:u,wIsConst:l,...t,cacheKey:`${e.format};${t.activation};`}},tr=(e,t,i,r)=>{let a=i.format==="NHWC",n=Io(t[0].dims,t[1].dims,i.dilations,i.pads,i.strides,a);if(i.group!==1){let x=[t[0]];if(a){let v=e.kernelCustomData.wT??e.compute(me(t[1],Nt),{inputs:[1],outputs:[i.wIsConst?-2:-1]})[0];i.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=v),x.push(v)}else x.push(t[1]);t.length===3&&x.push(t[2]),!e.adapterInfo.isArchitecture("ampere")&&a&&t[1].dims[0]===i.group&&t[1].dims[1]===1&&i.dilations[0]===1&&i.dilations[1]===1?e.compute(ko(x,i,n,r),{inputs:x}):e.compute(xo(x,i,n,r),{inputs:x});return}let s=t.length===3,o=t[0].dims[a?1:2],u=t[0].dims[a?2:3],l=t[0].dims[a?3:1],d=t[1].dims[2],p=t[1].dims[3],h=n[a?1:2],c=n[a?2:3],f=n[a?3:1],m=a&&d===o&&p===u&&i.pads[0]===0&&i.pads[1]===0;if(m||d===1&&p===1&&i.dilations[0]===1&&i.dilations[1]===1&&i.strides[0]===1&&i.strides[1]===1&&i.pads[0]===0&&i.pads[1]===0){let x=n[0],v,I,T,C=[];if(a){let P=e.kernelCustomData.wT??e.compute(me(t[1],Nt),{inputs:[1],outputs:[i.wIsConst?-2:-1]})[0];if(i.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=P),m){let Z=o*u*l;v=t[0].reshape([1,x,Z]),I=P.reshape([1,Z,f]),T=[1,x,f]}else v=t[0].reshape([x,o*u,l]),I=P.reshape([1,l,f]),T=[x,h*c,f];C.push(v),C.push(I)}else v=t[0].reshape([x,l,o*u]),I=t[1].reshape([1,f,l]),T=[x,f,h*c],C.push(I),C.push(v);s&&C.push(t[2]);let q=T[2],D=C[0].dims[C[0].dims.length-1];q<8&&D<8?e.compute(Fi(C,i,n,T,a,r),{inputs:C}):e.compute(qt(C,i,n,T,a,r),{inputs:C});return}let y=!0,_=e.kernelCustomData.wT??e.compute(me(t[1],Nt),{inputs:[1],outputs:[i.wIsConst?-2:-1]})[0];i.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=_);let g=[t[0],_];s&&g.push(t[2]);let w=a?h*c:f,$=a?f:h*c,b=d*p*l;e.compute(_o(g,i,n,w,$,b,s,y,r),{inputs:g})},To=(e,t)=>{let i=t.format==="NHWC",r=[e.inputs[0].reshape(i?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&r.push(e.inputs[2]);let a=[0,t.pads[0],0,t.pads[1]],n=[1].concat(t.strides),s=[1].concat(t.dilations),o=[1].concat(t.kernelShape),u=Vt({...t,pads:a,strides:n,dilations:s,kernelShape:o},r);tr(e,r,u,l=>i?[l[0],l[2],l[3]]:[l[0],l[1],l[3]])},zo=(e,t,i)=>{let r=i.format==="NHWC"?"channelsLast":"channelsFirst",a=Vt(i,t),n=i.autoPad==="NOTSET"?i.pads:i.autoPad,s=bo(t[0].dims,t[1].dims,i.strides,i.dilations,n,!1,r);e.compute(vo(t,a,s.outShape,[s.filterDepth,s.filterHeight,s.filterWidth],[s.padInfo.front,s.padInfo.top,s.padInfo.left],r))},ir=(e,t)=>{if(So(e.inputs,t),e.inputs[0].dims.length===3)To(e,t);else if(e.inputs[0].dims.length===5)zo(e,e.inputs,t);else{let i=Vt(t,e.inputs);tr(e,e.inputs,i)}}}),Eo,Mp=E(()=>{V(),Ce(),L(),W(),Eo=(e,t,i)=>{let r=e.length>2,a=t.outputShape,n=t.format==="NHWC",s=t.group,o=e[1].dims,u=o[2]/s,l=o[3],d=n?ie(u):1,p=n&&l===1&&u>=4,h=p?Math.floor(u/4)*4:Math.floor(u/d)*d,c=u-h,f=n?ie(l):1,m=n?l===1?d:f:1,y=k.size(a)/f,_=[Math.ceil(y/64),1,1];F("verbose",()=>`[conv2d_backprop_webgpu] dispatch = ${_}`);let g=["rank","rank"],w=[t.strides[0],t.strides[1]],$=[t.kernelShape[n?1:2],t.kernelShape[n?2:3]],b=[t.dilations[0],t.dilations[1]],x=[$[0]+(t.dilations[0]<=1?0:(t.kernelShape[n?1:2]-1)*(t.dilations[0]-1)),$[1]+(t.dilations[1]<=1?0:(t.kernelShape[n?2:3]-1)*(t.dilations[1]-1))],v=[x[0]-1-Math.floor((t.pads[0]+t.pads[2])/2),x[1]-1-Math.floor((t.pads[1]+t.pads[3])/2)],I=[{type:12,data:y},{type:12,data:w},{type:12,data:$},{type:12,data:b},{type:12,data:x},{type:6,data:v},{type:12,data:h},{type:12,data:u},{type:12,data:l},...M(e[0].dims,e[1].dims)];r&&(I.push(...M(e[2].dims)),g.push("rank")),I.push(...M(a));let T=C=>{let q=[{name:"output_size",type:"u32"},{name:"strides",type:"u32",length:w.length},{name:"filter_dims",type:"u32",length:$.length},{name:"dilations",type:"u32",length:$.length},{name:"effective_filter_dims",type:"u32",length:x.length},{name:"pads",type:"i32",length:v.length},{name:"input_channels_per_group_int",type:"u32"},{name:"input_channels_per_group",type:"u32"},{name:"output_channels_per_group",type:"u32"}],D=ae(e[0].dataType),P=n?1:2,Z=n?2:3,H=n?3:1,U=S("W",e[1].dataType,e[1].dims.length,m),A=S("Dy",e[0].dataType,e[0].dims.length,d),J=[A,U];r&&J.push(S("bias",e[2].dataType,[a[H]].length,f));let G=O("result",e[0].dataType,a.length,f),j=()=>{let N="";if(p)d===4?N+=`
        let xValue = ${A.getByOffset("x_offset")};
        let wValue = ${U.getByOffset("w_offset")};
        dotProd = dotProd + dot(xValue, wValue);
        x_offset += 1u;
        w_offset += 1u;`:d===2?N+=`
          dotProd = dotProd + dot(vec4<${D}>(${A.getByOffset("x_offset")}, ${A.getByOffset("x_offset + 1u")}), vec4<${D}>(${U.getByOffset("w_offset")}, ${U.getByOffset("w_offset + 1u")}));
          x_offset += 2u;
          w_offset += 2u;`:d===1&&(N+=`
          dotProd = dotProd + dot(vec4<${D}>(${A.getByOffset("x_offset")}, ${A.getByOffset("x_offset + 1u")}, ${A.getByOffset("x_offset + 2u")}, ${A.getByOffset("x_offset + 3u")}), vec4<${D}>(${U.getByOffset("w_offset")}, ${U.getByOffset("w_offset + 1u")}, ${U.getByOffset("w_offset + 2u")}, ${U.getByOffset("w_offset + 3u")}));
          x_offset += 4u;
          w_offset += 4u;`);else if(N+=`
                  let xValue = ${n?A.getByOffset(`${A.indicesToOffset(`${A.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${d}`):A.get("batch","inputChannel","idyR","idyC")};
        `,d===1)N+=`
          let w_offset = ${U.indicesToOffset(`${U.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel, wOutChannel)`)};
          let wValue = ${U.getByOffset(`w_offset / ${m}`)};
          dotProd = dotProd + xValue * wValue;`;else for(let X=0;X<d;X++)N+=`
            let wValue${X} = ${U.getByOffset(`${U.indicesToOffset(`${U.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel + ${X}, wOutChannel)`)} / ${m}`)};
            dotProd = dotProd + xValue[${X}] * wValue${X};`;return N},z=()=>{if(c===0)return"";if(!p)throw new Error(`packInputAs4 ${p} is not true.`);let N="";if(d===1){N+="dotProd = dotProd";for(let X=0;X<c;X++)N+=`
            + ${A.getByOffset(`x_offset + ${X}`)} * ${U.getByOffset(`w_offset + ${X}`)}`;N+=";"}else if(d===2){if(c!==2)throw new Error(`Invalid inputChannelsRemainder ${c}.`);N+=`
          let xValue = ${A.getByOffset("x_offset")};
          let wValue = ${U.getByOffset("w_offset")};
          dotProd = dotProd + dot(xValue, wValue);`}return N},B=`
            let outputIndices = ${G.offsetToIndices(`global_idx * ${f}`)};
            let batch = ${G.indicesGet("outputIndices",0)};
            let d1 = ${G.indicesGet("outputIndices",H)};
            let r = ${G.indicesGet("outputIndices",P)};
            let c = ${G.indicesGet("outputIndices",Z)};
            let dyCorner = vec2<i32>(i32(r), i32(c)) - uniforms.pads;
            let dyRCorner = dyCorner.x;
            let dyCCorner = dyCorner.y;
            let groupId = d1 / uniforms.output_channels_per_group;
            let wOutChannel = d1 - groupId * uniforms.output_channels_per_group;
            // Convolve dy(?, ?, d2) with w(:, :, d1, d2) to compute dx(xR, xC, d1).
            // ? = to be determined. : = across all values in that axis.
            var dotProd = ${G.type.value}(0.0);
            var wR: u32 = 0;
            if (uniforms.dilations.x == 1) {
              // Minimum wR >= 0 that satisfies (dyRCorner + wR) % (uniforms.strides.x) == 0
              wR = u32(((dyRCorner + i32(uniforms.strides.x) - 1) / i32(uniforms.strides.x)) * i32(uniforms.strides.x) - dyRCorner);
            }
            for (; wR < uniforms.effective_filter_dims.x; wR = wR + 1) {
              if (wR % uniforms.dilations.x != 0) {
                continue;
              }
              let dyR = (${D}(dyRCorner) + ${D}(wR)) / ${D}(uniforms.strides[0]);
              let wRPerm = uniforms.filter_dims.x - 1 - wR / uniforms.dilations.x;
              if (dyR < 0.0 || dyR >= ${D}(uniforms.Dy_shape[${P}]) || fract(dyR) > 0.0 ||
                  wRPerm < 0) {
                continue;
              }
              let idyR: u32 = u32(dyR);
              var wC: u32 = 0;
              if (uniforms.dilations.y == 1) {
                // Minimum wC >= 0 that satisfies (dyCCorner + wC) % (uniforms.strides.y) == 0
                wC = u32(((dyCCorner + i32(uniforms.strides.y) - 1) / i32(uniforms.strides.y)) * i32(uniforms.strides.y) - dyCCorner);
              }
              for (; wC < uniforms.effective_filter_dims.y; wC = wC + 1) {
                if (wC % uniforms.dilations.y != 0) {
                  continue;
                }
                let dyC = (${D}(dyCCorner) + ${D}(wC)) / ${D}(uniforms.strides.y);
                let wCPerm = uniforms.filter_dims.y - 1 - wC / uniforms.dilations.y;
                if (dyC < 0.0 || dyC >= ${D}(uniforms.Dy_shape[${Z}]) ||
                    fract(dyC) > 0.0 || wCPerm < 0) {
                  continue;
                }
                let idyC: u32 = u32(dyC);
                var inputChannel = groupId * uniforms.input_channels_per_group;
                ${p?`
                var x_offset = ${A.indicesToOffset(`${A.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${d};
                var w_offset = ${U.indicesToOffset(`${U.type.indices}(wRPerm, wCPerm, inputChannel, wOutChannel)`)} / ${m};
                  `:""}
                for (var d2: u32 = 0; d2 < uniforms.input_channels_per_group_int; d2 = d2 + ${p?4:d}) {
                  ${j()}
                  inputChannel = inputChannel + ${p?4:d};
                }
                ${z()}
                wC = wC + uniforms.strides.y - 1;
              }
              wR = wR + uniforms.strides[0] - 1;
            }
            let value = dotProd${r?` + bias[d1 / ${f}]`:""};
            ${G.setByOffset("global_idx","value")};
          `;return`
    ${C.registerUniforms(q).declareVariables(...J,G)}
      ${C.mainStart()}
      ${C.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")};
    ${B}}`};return{name:"ConvTranspose2D",shaderCache:{hint:`${t.cacheKey};${d}${m}${f}${p}${c}`,inputDependencies:g},getRunData:()=>({dispatchGroup:{x:_[0],y:_[1],z:_[2]},outputs:[{dims:i?i(a):a,dataType:e[0].dataType}],programUniforms:I}),getShaderSource:T}}}),Co,Bo,Ao,rr,Oo,Ro,ar,Do,Mo,Pp=E(()=>{Mp(),He(),Re(),Co=(e,t,i,r,a,n)=>(e-1)*t+i+(r-1)*a+1-n,Bo=(e,t,i,r,a)=>{let n=Math.floor(e/2);t==="SAME_UPPER"?(i[r]=n,i[a]=e-n):t==="SAME_LOWER"&&(i[r]=e-n,i[a]=n)},Ao=(e,t,i,r,a,n,s,o,u,l)=>{let d=e.length-2,p=l.length===0;u.length<d&&u.push(...Array(d-u.length).fill(0));let h=e[0],c=t[o?3:1]*a;for(let f=0,m=e.length-d-(o?1:0);f<d;++f,++m){let y=e[m],_=p?y*s[f]:l[f],g=Co(y,s[f],n[f],t[m],i[f],_);Bo(g,r,n,f,f+d),p&&l.push(s[f]*(y-1)+u[f]+(t[m]-1)*i[f]+1-n[f]-n[f+d])}l.splice(0,0,h),l.splice(o?3:1,0,c)},rr=(e,t)=>{let i=e.kernelShape.slice();if(e.kernelShape.length===0||e.kernelShape.reduce((p,h)=>p*h,1)===0){i.length=0;for(let p=2;p<t[1].dims.length;++p)i.push(t[1].dims[p])}let r=e.format==="NHWC";i.splice(0,0,t[1].dims[0]),i.splice(r?3:1,0,t[1].dims[1]);let a=e.pads.slice(),n=e.outputShape.slice(),s=e.outputPadding.slice(),o=t[0].dims,u=e.dilations.slice();if(u.reduce((p,h)=>p+h,0)===0){let p=t[0].dims.length-2;u=new Array(p).fill(1)}let l=e.strides.slice();if(l.reduce((p,h)=>p+h,0)===0){let p=t[0].dims.length-2;l=new Array(p).fill(1)}Ao(o,i,u,e.autoPad,e.group,a,l,r,s,n);let d=Object.assign({},e);return Object.assign(d,{kernelShape:i,pads:a,outputPadding:s,outputShape:n,dilations:u,strides:l}),d},Oo=e=>{let t=Gi(e),i=e.format,r=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][typeof e.autoPad>"u"?0:e.autoPad],a=e.dilations,n=e.group,s=e.kernelShape,o=e.pads,u=e.strides,l=e.wIsConst(),d=e.outputPadding,p=e.outputShape;return{autoPad:r,format:i,dilations:a,group:n,kernelShape:s,outputPadding:d,outputShape:p,pads:o,strides:u,wIsConst:l,...t,cacheKey:`${e.format};${t.activation};`}},Ro=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length!==4&&e[0].dims.length!==3)throw new Error("currently only support 2-dimensional conv");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let i=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],r=e[1].dims[0];if(i!==r)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");let a=e[1].dims[1]*t.group;if(e.length===3&&(e[2].dims.length!==1||e[2].dims[0]!==a))throw new Error("invalid bias");let n=e[0].dims.length-2;if(t.dilations.reduce((s,o)=>s+o,0)>0&&t.dilations.length!==n)throw new Error(`dilations should be ${n}D`);if(t.strides.reduce((s,o)=>s+o,0)>0&&t.strides.length!==n)throw new Error(`strides should be ${n}D`);if(t.pads.reduce((s,o)=>s+o,0)>0&&t.pads.length!==n*2)throw new Error(`pads should be ${n*2}D`);if(t.outputPadding.length!==n&&t.outputPadding.length!==0)throw new Error(`output_padding should be ${n}D`);if(t.kernelShape.reduce((s,o)=>s+o,0)>0&&t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape");if(t.outputShape.length!==0&&t.outputShape.length!==e[0].dims.length-2)throw new Error("invalid output shape")},ar=(e,t,i,r)=>{let a=e.kernelCustomData.wT??e.compute(me(t[1],[2,3,0,1]),{inputs:[1],outputs:[i.wIsConst?-2:-1]})[0];i.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=a);let n=[t[0],a];t.length===3&&n.push(t[2]),e.compute(Eo(n,i,r),{inputs:n})},Do=(e,t)=>{let i=t.format==="NHWC",r=[e.inputs[0].reshape(i?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&r.push(e.inputs[2]);let a=t.kernelShape;(a.length===0||a[0]===0)&&(a=[e.inputs[1].dims[2]]);let n=t.dilations;(n.length===0||n[0]===0)&&(n=[1]);let s=t.strides;(s.length===0||s[0]===0)&&(s=[1]);let o=t.pads;o.length===0&&(o=[0,0]),o=[0,o[0],0,o[1]],s=[1].concat(s),n=[1].concat(n),a=[1].concat(a);let u=t.outputPadding;u=[0].concat(u);let l=rr({...t,pads:o,strides:s,dilations:n,kernelShape:a,outputPadding:u},r);ar(e,r,l,d=>i?[d[0],d[2],d[3]]:[d[0],d[1],d[3]])},Mo=(e,t)=>{if(Ro(e.inputs,t),e.inputs[0].dims.length===3)Do(e,t);else{let i=rr(t,e.inputs);ar(e,e.inputs,i)}}}),Po,Uo,qo,Up=E(()=>{V(),L(),re(),W(),Po=(e,t,i,r)=>{let a=k.size(t),n=t.length,s=S("input",e,n),o=O("output",e,n),u=i.dataType===6?i.getInt32Array()[0]:Number(i.getBigInt64Array()[0]),l=k.normalizeAxis(u,n),d=p=>{let h=` i32(${s.indicesGet("inputIndices","uniforms.axis")}) `,c=R("uniforms.input_shape","uniforms.axis",n),f=r.reverse?h+(r.exclusive?" + 1":""):"0",m=r.reverse?c:h+(r.exclusive?"":" + 1");return`
                ${p.registerUniform("outputSize","u32").registerUniform("axis","u32").declareVariables(s,o)}
                ${p.mainStart()}
                  ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
                  var inputIndices = ${o.offsetToIndices("global_idx")};
                  var sum = ${o.type.value}(0);
                  let first : i32 = ${f};
                  let last : i32 = ${m};
                  for (var i : i32 = first; i < last; i++) {
                    ${s.indicesSet("inputIndices","uniforms.axis","u32(i)")};
                    sum = sum + ${s.getByIndices("inputIndices")};
                  }
                  ${o.setByOffset("global_idx","sum")};
                }`};return{name:"CumSum",shaderCache:{hint:r.cacheKey,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:t,dataType:e}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:[{type:12,data:a},{type:12,data:l},...M(t,t)]}),getShaderSource:d}},Uo=(e,t)=>{let i=e.inputs[0].dims,r=e.inputs[0].dataType,a=e.inputs[1];e.compute(Po(r,i,a,t),{inputs:[0]})},qo=e=>{let t=e.exclusive===1,i=e.reverse===1;return Q({exclusive:t,reverse:i})}}),No,Vo,Lo,Wo,Go,qp=E(()=>{V(),L(),re(),W(),No=e=>{if(!e||e.length!==1)throw new Error("DepthToSpace requires 1 input.");if(e[0].dims.length!==4)throw new Error("DepthToSpace requires 4D input.")},Vo=(e,t,i,r)=>{let a=[];a.push(`fn perm(i: ${r.type.indices}) -> ${i.type.indices} {
    var a: ${i.type.indices};`);for(let n=0;n<t;++n)a.push(i.indicesSet("a",e[n],`i[${n}]`));return a.push("return a;}"),a.join(`
`)},Lo=(e,t)=>{let i,r,a,n,s,o,u=t.format==="NHWC",l=t.blocksize,d=t.mode==="DCR";u?([i,r,a,n]=e.dims,s=d?[i,r,a,l,l,n/l**2]:[i,r,a,n/l**2,l,l],o=d?[0,1,3,2,4,5]:[0,1,4,2,5,3]):([i,r,a,n]=[e.dims[0],e.dims[2],e.dims[3],e.dims[1]],s=d?[i,l,l,n/l**2,r,a]:[i,n/l**2,l,l,r,a],o=d?[0,3,4,1,5,2]:[0,1,4,2,5,3]);let p=e.reshape(s),h=p.dims.length,c=e.dataType,f=S("a",c,h),m=O("output",c,h),y=_=>`
  ${_.registerUniform("output_size","u32").declareVariables(f,m)}

  ${Vo(o,h,f,m)}

  ${_.mainStart()}
    ${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${m.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${m.setByOffset("global_idx",f.getByIndices("aIndices"))}
  }`;return{name:"DepthToSpace",shaderCache:{hint:`${e.dims};${t.blocksize};${t.mode}`,inputDependencies:["rank"]},getRunData:_=>{let g=u?[i,r*l,a*l,n/l**2]:[i,n/l**2,r*l,a*l],w=k.size(g),$=p.dims,b=k.sortBasedOnPerm($,o);return{outputs:[{dims:g,dataType:_[0].dataType}],dispatchGroup:{x:Math.ceil(w/64)},programUniforms:[{type:12,data:w},...M($,b)]}},getShaderSource:y}},Wo=(e,t)=>{No(e.inputs),e.compute(Lo(e.inputs[0],t))},Go=e=>Q({blocksize:e.blocksize,mode:e.mode,format:e.format})}),Lt,$t,nr,Ho,Fo,jo,Ko,sr,Zo,Qo,Xo,Np=E(()=>{V(),L(),re(),W(),Lt="[a-zA-Z]|\\.\\.\\.",$t="("+Lt+")+",nr="^"+$t+"$",Ho="("+$t+",)*"+$t,Fo="^"+Ho+"$",jo=class{constructor(e=-1){this.symbolToIndices=new Map,this.inputIndex=e}addSymbol(e,t){let i=this.symbolToIndices.get(e);i===void 0?i=[t]:i.push(t),this.symbolToIndices.set(e,i)}},Ko=class{constructor(e,t){var a;this.equation=t,this.hasEllipsis=!1,this.symbolToInfo=new Map,this.lhs=new Array,this.outputDims=[];let[i,r]=t.includes("->")?t.split("->",2):[t,""];if(!i.match(RegExp(Fo)))throw new Error("Invalid LHS term");if(i.split(",").forEach((n,s)=>{let o=e[s].dims.slice();if(!n.match(RegExp(nr)))throw new Error("Invalid LHS term");let u=this.processTerm(n,!0,o,s);this.lhs.push(u)}),r==="")r+=[...this.symbolToInfo.entries()].filter(([n,s])=>s.count===1||n==="...").map(([n])=>n).join("");else if(!r.match(RegExp($t)))throw new Error("Invalid RHS");(a=r.match(RegExp(Lt,"g")))==null||a.forEach(n=>{if(n==="...")this.outputDims=this.outputDims.concat(this.ellipsisDims);else{let s=this.symbolToInfo.get(n);if(s===void 0)throw new Error("Invalid RHS symbol");this.outputDims.push(s.dimValue)}}),this.rhs=this.processTerm(r,!1,this.outputDims)}addSymbol(e,t,i){let r=this.symbolToInfo.get(e);if(r!==void 0){if(r.dimValue!==t&&r.count!==1)throw new Error("Dimension mismatch");r.count++,r.inputIndices.push(i)}else r={count:1,dimValue:t,inputIndices:[i]};this.symbolToInfo.set(e,r)}processTerm(e,t,i,r=-1){let a=i.length,n=!1,s=[],o=0;if(!e.match(RegExp(nr))&&!t&&e!=="")throw new Error("Invalid LHS term");let u=e.match(RegExp(Lt,"g")),l=new jo(r);return u==null||u.forEach((d,p)=>{if(d==="..."){if(n)throw new Error("Only one ellipsis is allowed per input term");n=!0;let h=a-u.length+1;if(h<0)throw new Error("Ellipsis out of bounds");if(s=i.slice(o,o+h),this.hasEllipsis){if(this.ellipsisDims.length!==s.length||this.ellipsisDims.toString()!==s.toString())throw new Error("Ellipsis dimensions mismatch")}else if(t)this.hasEllipsis=!0,this.ellipsisDims=s;else throw new Error("Ellipsis must be specified in the LHS");for(let c=0;c<s.length;c++){let f=String.fromCharCode(48+c);l.addSymbol(f,p+c),this.addSymbol(f,i[o++],r)}}else l.addSymbol(d,p+(this.hasEllipsis?this.ellipsisDims.length-1:0)),this.addSymbol(d,i[o++],r)}),l}},sr=e=>e+"_max",Zo=(e,t,i,r)=>{let a=e.map(l=>l.length).map((l,d)=>S(`input${d}`,t,l)),n=k.size(r),s=O("output",t,r.length),o=[...i.symbolToInfo.keys()].filter(l=>!i.rhs.symbolToIndices.has(l)),u=l=>{let d=[],p="var prod = 1.0;",h="var sum = 0.0;",c="sum += prod;",f=[],m=[],y=[],_=[],g=i.symbolToInfo.size===i.rhs.symbolToIndices.size;i.symbolToInfo.forEach(($,b)=>{var x;if(i.rhs.symbolToIndices.has(b)){let v=(x=i.rhs.symbolToIndices.get(b))==null?void 0:x[0];v!==void 0&&i.lhs.forEach((I,T)=>{if($.inputIndices.includes(T)){let C=I.symbolToIndices.get(b);if(C===void 0)throw new Error("Invalid symbol error");C.forEach(q=>{d.push(`${a[T].indicesSet(`input${T}Indices`,q,s.indicesGet("outputIndices",v))}`)})}})}else i.lhs.forEach((v,I)=>{if($.inputIndices.includes(I)){let T=v.symbolToIndices.get(b);if(T===void 0)throw new Error("Invalid symbol error");T.forEach(C=>{f.push(`${a[I].indicesSet(`input${I}Indices`,C,`${b}`)}`)}),_.push(`prod *= ${a[I].getByIndices(`input${I}Indices`)};`)}}),m.push(`for(var ${b}: u32 = 0; ${b} < uniforms.${sr(b)}; ${b}++) {`),y.push("}")});let w=g?[...d,`let sum = ${a.map(($,b)=>$.getByIndices(`input${b}Indices`)).join(" * ")};`]:[...d,h,...m,...f,p,..._,c,...y];return`
            ${l.registerUniforms(o.map($=>({name:`${sr($)}`,type:"u32"}))).registerUniform("outputSize","u32").declareVariables(...a,s)}

            ${l.mainStart()}
            ${l.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
            var outputIndices = ${s.offsetToIndices("global_idx")};
            ${a.map(($,b)=>`var input${b}Indices: ${a[b].type.indices};`).join(`
`)}
            ${w.join(`
`)};
            ${s.setByOffset("global_idx","sum")};
          }`};return{name:"Einsum",shaderCache:{hint:i.equation,inputDependencies:e.map(()=>"rank")},getRunData:()=>{let l=o.filter(p=>i.symbolToInfo.has(p)).map(p=>{var h;return{type:12,data:((h=i.symbolToInfo.get(p))==null?void 0:h.dimValue)||0}});l.push({type:12,data:n});let d=e.map((p,h)=>[...M(p)]).reduce((p,h)=>p.concat(h),l);return d.push(...M(r)),{outputs:[{dims:r,dataType:t}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:d}},getShaderSource:u}},Qo=(e,t)=>{let i=new Ko(e.inputs,t.equation),r=i.outputDims,a=e.inputs.map((n,s)=>n.dims);e.compute(Zo(a,e.inputs[0].dataType,i,r))},Xo=e=>{let t=e.equation.replace(/\s+/g,"");return Q({equation:t})}}),Yo,or,Jo,eu,tu,Vp=E(()=>{V(),L(),W(),Yo=e=>{if(!e||e.length!==2)throw new Error("Expand requires 2 input.");let t=e[0].dims,i=Array.from(e[1].getBigInt64Array(),Number),r=i.length<t.length?0:i.length-t.length,a=t.length<i.length?0:t.length-i.length;for(;r<i.length&&a<t.length;++r,++a)if(i[r]!==t[a]&&i[r]!==1&&t[a]!==1)throw new Error("Expand requires shape to be broadcastable to input")},or=(e,t)=>{let i=e.length-t.length,r=[];for(let a=0;a<i;++a)r.push(e[a]);for(let a=0;a<t.length;++a)r.push(t[a]===1?e[a+i]:t[a]);return r},Jo=(e,t)=>e.length>t.length?or(e,t):or(t,e),eu=e=>{let t=e[0].dims,i=Array.from(e[1].getBigInt64Array(),Number),r=Jo(t,i),a=e[0].dataType,n=a===9||k.size(t)===1,s=a===9||t.length>0&&t[t.length-1]%4===0?4:1,o=n||r.length>0&&r[r.length-1]%4===0?4:1,u=Math.ceil(k.size(r)/o),l=p=>{let h=S("input",a,t.length,s),c=O("output",a,r.length,o),f;if(a===9){let m=(y,_,g="")=>`
          let outputIndices${_} = ${c.offsetToIndices(`outputOffset + ${_}u`)};
          let offset${_} = ${h.broadcastedIndicesToOffset(`outputIndices${_}`,c)};
          let index${_} = offset${_} / 4u;
          let component${_} = offset${_} % 4u;
          ${y}[${_}] = ${g}(${h.getByOffset(`index${_}`)}[component${_}]);
        `;f=`
        let outputOffset = global_idx * ${o};
        var data = vec4<u32>(0);
        ${m("data",0,"u32")}
        ${m("data",1,"u32")}
        ${m("data",2,"u32")}
        ${m("data",3,"u32")}
        ${c.setByOffset("global_idx","data")}
      }`}else f=`
        let outputIndices = ${c.offsetToIndices(`global_idx * ${o}`)};
        let inputOffset = ${h.broadcastedIndicesToOffset("outputIndices",c)};
        let data = ${c.type.value}(${h.getByOffset(`inputOffset / ${s}`)});
        ${c.setByOffset("global_idx","data")}
      }`;return`
    ${p.registerUniform("vec_size","u32").declareVariables(h,c)}
    ${p.mainStart()}
    ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
    ${f}`},d=[{type:12,data:u},...M(t,r)];return{name:"Expand",shaderCache:{hint:`${r.length};${s}${o}`,inputDependencies:["rank"]},getShaderSource:l,getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:d})}},tu=e=>{Yo(e.inputs),e.compute(eu(e.inputs),{inputs:[0]})}}),iu,ru,Lp=E(()=>{V(),L(),W(),Wi(),iu=e=>{let t=e[0].dataType,i=k.size(e[0].dims),r=k.size(e[1].dims),a=r%4===0,n=s=>{let o=S("x",t,[1],4),u=S("bias",t,[1],4),l=O("y",t,[1],4),d=[{name:"output_vec_size",type:"u32"},{name:"bias_size",type:"u32"}],p=c=>`
      let bias${c}_offset: u32 = (global_idx * 4 + ${c}) % uniforms.bias_size;
      let bias${c} = ${u.getByOffset(`bias${c}_offset / 4`)}[bias${c}_offset % 4];`,h=a?`
      let bias = ${u.getByOffset("global_idx % (uniforms.bias_size / 4)")};`:`${p(0)}${p(1)}${p(2)}${p(3)}
      let bias = ${o.type.value}(bias0, bias1, bias2, bias3);`;return`${s.registerUniforms(d).declareVariables(o,u,l)}

    ${Vi(oe(t))}

    ${s.mainStart(it)}
      ${s.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_vec_size")}

      let x = ${o.getByOffset("global_idx")};
      ${h}
      let x_in = x + bias;
      ${l.setByOffset("global_idx",Li("x_in"))}
    }`};return{name:"FastGeluWithBias",shaderCache:{hint:`${a}`,inputDependencies:["type","type"]},getShaderSource:n,getRunData:s=>({outputs:[{dims:s[0].dims,dataType:s[0].dataType}],programUniforms:[{type:12,data:Math.ceil(i/4)},{type:12,data:r}],dispatchGroup:{x:Math.ceil(i/it/4)}})}},ru=e=>{e.inputs.length<2||k.size(e.inputs[1].dims)===0?Ms(e):e.compute(iu(e.inputs))}}),au,nu,su,ou,Wp=E(()=>{V(),L(),re(),W(),au=e=>{if(!e||e.length!==2)throw new Error("Gather requires 2 inputs.")},nu=(e,t)=>{let i=e[0].dims,r=e[1].dims,a=i.length,n=k.normalizeAxis(t.axis,a),s=i.slice(0);s.splice(n,1,...r);let o=i[n],u=e[0].dataType===9?4:1,l=Math.ceil(k.size(s)/u),d=[{type:12,data:l},{type:6,data:o},{type:12,data:n},...M(e[0].dims,e[1].dims,s)],p=h=>{let c=S("data",e[0].dataType,e[0].dims.length,u),f=S("inputIndices",e[1].dataType,e[1].dims.length),m=O("output",e[0].dataType,s.length,u),y=g=>{let w=r.length,$=`var indicesIndices${g}  = ${f.type.indices}(0);`;for(let b=0;b<w;b++)$+=`${w>1?`indicesIndices${g}[${b}]`:`indicesIndices${g}`} = ${s.length>1?`outputIndices${g}[uniforms.axis + ${b}]`:`outputIndices${g}`};`;$+=`
          var idx${g} = ${f.getByIndices(`indicesIndices${g}`)};
          if (idx${g} < 0) {
            idx${g} = idx${g} + uniforms.axisDimLimit;
          }
          var dataIndices${g} : ${c.type.indices};
        `;for(let b=0,x=0;b<a;b++)b===n?($+=`${a>1?`dataIndices${g}[${b}]`:`dataIndices${g}`} = u32(idx${g});`,x+=w):($+=`${a>1?`dataIndices${g}[${b}]`:`dataIndices${g}`} = ${s.length>1?`outputIndices${g}[${x}]`:`outputIndices${g}`};`,x++);return $},_;if(e[0].dataType===9){let g=(w,$,b="")=>`
          let outputIndices${$} = ${m.offsetToIndices(`outputOffset + ${$}u`)};
          ${y($)};
          let offset${$} = ${c.indicesToOffset(`dataIndices${$}`)};
          let index${$} = offset${$} / 4u;
          let component${$} = offset${$} % 4u;
          ${w}[${$}] = ${b}(${c.getByOffset(`index${$}`)}[component${$}]);
        `;_=`
        let outputOffset = global_idx * ${u};
        var value = vec4<u32>(0);
        ${g("value",0,"u32")}
        ${g("value",1,"u32")}
        ${g("value",2,"u32")}
        ${g("value",3,"u32")}
        ${m.setByOffset("global_idx","value")}
      `}else _=`
      let outputIndices = ${m.offsetToIndices("global_idx")};
      ${y("")};
      let value = ${c.getByIndices("dataIndices")};
      ${m.setByOffset("global_idx","value")};
      `;return`
      ${h.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(c,f,m)}
      ${h.mainStart()}
        ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        ${_}
      }`};return{name:"Gather",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:s,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:d}),getShaderSource:p}},su=e=>Q({axis:e.axis}),ou=(e,t)=>{let i=e.inputs;au(i),e.compute(nu(e.inputs,t))}}),uu,lu,du,Gp=E(()=>{V(),L(),W(),uu=(e,t,i,r,a,n,s,o,u)=>{let l=[{type:12,data:n},{type:12,data:r},{type:12,data:a},{type:12,data:i},{type:12,data:s},{type:12,data:o},{type:12,data:u}],d=[n];l.push(...M(t.dims,d));let p=h=>{let c=S("indices_data",t.dataType,t.dims.length),f=O("input_slice_offsets_data",12,1,1),m=[c,f],y=[{name:"output_size",type:"u32"},{name:"batch_dims",type:"u32"},{name:"input_dims",type:"u32",length:a.length},{name:"sizes_from_slice_dims_data",type:"u32",length:i.length},{name:"num_slices_per_batch",type:"u32"},{name:"input_batch_stride",type:"u32"},{name:"num_slice_dims",type:"u32"}];return`
  ${h.registerUniforms(y).declareVariables(...m)}
  ${h.mainStart()}
    ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let batch_idx = global_idx / uniforms.num_slices_per_batch;
    let base_offset = batch_idx * uniforms.input_batch_stride;

    let slice_indices_base_offset = global_idx * uniforms.num_slice_dims;
    var relative_slice_offset = 0;
    for (var dim_idx = 0u; dim_idx < uniforms.num_slice_dims; dim_idx ++) {
      var index = i32(indices_data[dim_idx + slice_indices_base_offset].x);
      let input_dim_idx = uniforms.batch_dims + dim_idx;
      if (index < 0) {
        ${a.length===1?"index += i32(uniforms.input_dims);":"index += i32(uniforms.input_dims[input_dim_idx]);"}
      }
      ${i.length===1?"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data);":"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data[dim_idx]);"}
    }

    input_slice_offsets_data[global_idx] =  base_offset + u32(relative_slice_offset);
  }`};return e.compute({name:"computeSliceOffsets",shaderCache:{hint:`${a.length}_${i.length}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:d,dataType:e.inputs[1].dataType}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:l}),getShaderSource:p},{inputs:[t],outputs:[-1]})[0]},lu=(e,t)=>{let i=e.inputs,r=i[0].dims,a=i[0].dataType,n=i[1].dims,s=n[n.length-1],o=k.sizeToDimension(n,n.length-1),u=k.sizeFromDimension(r,t.batchDims+s),l=k.sizeToDimension(r,t.batchDims),d=k.sizeFromDimension(r,t.batchDims),p=o/l,h=new Array(s),c=u;for(let $=0;$<s;++$)h[s-1-$]=c,c*=r[t.batchDims+s-1-$];let f=uu(e,i[1],h,t.batchDims,r,o,p,d,s),m=t.batchDims+s;if(m>r.length)throw new Error("last dimension of indices must not be larger than rank of input tensor");let y=n.slice(0,-1).concat(r.slice(m)),_=k.size(y),g=[{type:12,data:_},{type:12,data:u},...M(i[0].dims,f.dims,y)],w=$=>{let b=S("data",i[0].dataType,i[0].dims.length),x=S("slice_offsets",12,f.dims.length),v=O("output",i[0].dataType,y.length);return`
          ${$.registerUniform("output_size","u32").registerUniform("slice_size","u32").declareVariables(b,x,v)}
            ${$.mainStart()}
            ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let slice_offset = slice_offsets[global_idx / uniforms.slice_size];
          output[global_idx] = data[u32(slice_offset) + global_idx % uniforms.slice_size];
        }`};e.compute({name:"GatherND",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:y,dataType:a}],dispatchGroup:{x:Math.ceil(_/64)},programUniforms:g}),getShaderSource:w},{inputs:[i[0],f]})},du=e=>({batchDims:e.batch_dims,cacheKey:""})}),pu,hu,cu,fu,Hp=E(()=>{V(),L(),re(),W(),pu=(e,t)=>{if(e.length<3||e.length>4)throw new Error("GatherBlockQuantized requires 3 or 4 inputs.");let i=k.normalizeAxis(t.quantizeAxis,e[0].dims.length),r=t.blockSize,a=e[0],n=e[2],s=e.length===4?e[3]:void 0;if(n.dims.length!==a.dims.length||!a.dims.map((o,u)=>u===i?Math.ceil(o/r)===n.dims[u]:o===n.dims[u]).reduce((o,u)=>o&&u,!0))throw new Error("Scales must have the same rank as the input tensor and the dims should match except on gatherAxis.");if(s){if(s.dataType!==a.dataType)throw new Error("Zero point must have the same data type as the input tensor.");if(s.dims.length!==n.dims.length||!s.dims.map((o,u)=>o===n.dims[u]).reduce((o,u)=>o&&u,!0))throw new Error("Zero point must have the same rank as the input tensor and the dims should match except on quantizeAxis.")}},hu=(e,t)=>{let i=e[0].dims,r=e[1].dims,a=i.length,n=k.normalizeAxis(t.gatherAxis,a),s=k.normalizeAxis(t.quantizeAxis,a),o=i.slice(0);o.splice(n,1,...r);let u=k.size(o),l=e[2].dataType,d=e[0].dataType===22,p=[{type:12,data:u},{type:12,data:s},{type:12,data:n},{type:12,data:t.blockSize},...M(...e.map((c,f)=>c.dims),o)],h=c=>{let f=S("data",e[0].dataType,e[0].dims.length),m=S("inputIndices",e[1].dataType,e[1].dims.length),y=S("scales",e[2].dataType,e[2].dims.length),_=e.length>3?S("zeroPoint",e[3].dataType,e[3].dims.length):void 0,g=O("output",l,o.length),w=[f,m,y];_&&w.push(_);let $=[{name:"output_size",type:"u32"},{name:"quantize_axis",type:"u32"},{name:"gather_axis",type:"u32"},{name:"block_size",type:"u32"}];return`
        ${c.registerUniforms($).declareVariables(...w,g)}
        ${c.mainStart()}
        let output_indices = ${g.offsetToIndices("global_idx")};
        var indices_indices = ${m.type.indices}(0);
        ${r.length>1?`
          for (var i: u32 = 0; i < ${r.length}; i++) {
            let index = ${g.indicesGet("output_indices","uniforms.gather_axis + i")};
            ${m.indicesSet("indices_indices","i","index")};
          }`:`indices_indices = ${g.indicesGet("output_indices","uniforms.gather_axis")};`};
        var data_indices = ${f.type.indices}(0);
        for (var i: u32 = 0; i < uniforms.gather_axis; i++) {
          let index = ${g.indicesGet("output_indices","i")};
          ${f.indicesSet("data_indices","i","index")};
        }
        var index_from_indices = ${m.getByIndices("indices_indices")};
        if (index_from_indices < 0) {
          index_from_indices += ${i[n]};
        }
        ${f.indicesSet("data_indices","uniforms.gather_axis","u32(index_from_indices)")};
        for (var i = uniforms.gather_axis + 1; i < ${o.length}; i++) {
          let index = ${g.indicesGet("output_indices",`i + ${r.length} - 1`)};
          ${f.indicesSet("data_indices","i","index")};
        }
        let data_offset = ${f.indicesToOffset("data_indices")};
        let data_index = data_offset % 8;
        // Convert 4-bit packed data to 8-bit packed data.
        let packed_4bit_quantized_data = ${f.getByOffset("data_offset / 8")};
        let packed_8bit_quantized_data = (packed_4bit_quantized_data >> (4 * (data_index % 2))) & 0x0f0f0f0f;
        let quantized_data_vec = ${d?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_quantized_data));
        let quantized_data = quantized_data_vec[data_index / 2];
        var scale_indices = data_indices;
        let quantize_axis_index = ${y.indicesGet("data_indices","uniforms.quantize_axis")} / uniforms.block_size;
        ${y.indicesSet("scale_indices","uniforms.quantize_axis","quantize_axis_index")};
        var scale = ${y.getByIndices("scale_indices")};
        ${_?`
              let zero_point_indices = scale_indices;
              let zero_point_offset = ${_.indicesToOffset("zero_point_indices")};
              let zero_point_index = zero_point_offset % 8;
              let packed_4bit_zero_points = ${_.getByOffset("zero_point_offset / 8")};
              let packed_8bit_zero_points = (packed_4bit_zero_points >> (4 * (zero_point_index % 2))) & 0x0f0f0f0f;
              let zero_point_vec = ${d?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_zero_points));
              let zero_point = zero_point_vec[zero_point_index / 2];`:"var zero_point = 0"};
        let dequantized_data = ${oe(l)}(quantized_data - zero_point) * scale;
        ${g.setByOffset("global_idx","dequantized_data")};
    }`};return{name:"GatherBlockQuantized",shaderCache:{hint:`${t.cacheKey};${e.filter((c,f)=>f!==1).map(c=>c.dims.join("_")).join(";")}`,inputDependencies:Array.from({length:e.length},(c,f)=>"rank")},getRunData:()=>({outputs:[{dims:o,dataType:l}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:p}),getShaderSource:h}},cu=(e,t)=>{let i=e.inputs;pu(i,t),e.compute(hu(e.inputs,t))},fu=e=>Q({blockSize:e.blockSize,gatherAxis:e.gatherAxis,quantizeAxis:e.quantizeAxis})}),mu,gu,_u,yu,Fp=E(()=>{V(),L(),re(),W(),mu=e=>{if(!e||e.length!==2)throw new Error("GatherElements requires 2 inputs.");if(e[0].dims.length<1)throw new Error("GatherElements requires that the data input be rank >= 1.");if(e[0].dims.length!==e[1].dims.length)throw new Error(`GatherElements requires that the data input and
                     indices input tensors be of same rank.`)},gu=(e,t)=>{let i=e[0].dims,r=e[0].dataType,a=i.length,n=e[1].dims,s=e[1].dataType,o=k.normalizeAxis(t.axis,a),u=i[o],l=n.slice(0),d=k.size(l),p=S("input",r,a),h=S("indicesInput",s,n.length),c=O("output",r,l.length),f=[{type:12,data:d},{type:6,data:u},{type:12,data:o}];return f.push(...M(i,n,l)),{name:"GatherElements",shaderCache:{inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:l,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:f}),getShaderSource:m=>`
      ${m.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(p,h,c)}
      ${m.mainStart()}
      ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

      let outputIndices = ${c.offsetToIndices("global_idx")};

      var idx = ${h.getByOffset("global_idx")};
      if (idx < 0) {
        idx = idx + uniforms.axisDimLimit;
      }
      var inputIndices = ${p.type.indices}(outputIndices);
      ${p.indicesSet("inputIndices","uniforms.axis","u32(idx)")};
      let value = ${p.getByIndices("inputIndices")};

      ${c.setByOffset("global_idx","value")};
  }`}},_u=e=>Q({axis:e.axis}),yu=(e,t)=>{let i=e.inputs;mu(i),e.compute(gu(e.inputs,t))}}),$u,wu,bu,vu,jp=E(()=>{V(),L(),W(),$u=e=>{if(!e)throw new Error("Input is missing");if(e.length<2||e.length>3)throw new Error("Invaid input number.");if(e.length===3&&e[2].dims.length>2)throw new Error("Invalid input shape of C");if(e[0].dataType!==e[1].dataType||e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("Input types are mismatched")},wu=(e,t)=>{let i=e[0].dims.slice(),r=e[1].dims.slice(),[a,n,s]=Ea.getShapeOfGemmResult(i,t.transA,r,t.transB,e.length===3?e[2].dims:void 0),o=[a,n];if(!o)throw new Error("Can't use gemm on the given tensors");let u=16,l=Math.ceil(n/u),d=Math.ceil(a/u),p=!0,h=k.size(o),c=[{type:12,data:p?l:h},{type:12,data:a},{type:12,data:n},{type:12,data:s},{type:1,data:t.alpha},{type:1,data:t.beta}],f=["type","type"];e.length===3&&(c.push(...M(e[2].dims)),f.push("rank")),c.push(...M(o));let m=_=>{let g="";t.transA&&t.transB?g="value += a[k * uniforms.M + m] * b[n * uniforms.K + k];":t.transA&&!t.transB?g="value += a[k * uniforms.M + m] * b[k * uniforms.N + n];":!t.transA&&t.transB?g="value += a[m * uniforms.K + k] * b[n * uniforms.K + k];":!t.transA&&!t.transB&&(g="value += a[m * uniforms.K + k] * b[k * uniforms.N + n];");let w=t.alpha===1?"":"value *= uniforms.alpha;",$=S("a",e[0].dataType,e[0].dims),b=S("b",e[1].dataType,e[1].dims),x=$.type.value,v=null,I=[$,b];e.length===3&&(v=S("c",e[2].dataType,e[2].dims.length),I.push(v));let T=O("output",e[0].dataType,o.length);I.push(T);let C=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}];return`
  ${_.registerUniforms(C).declareVariables(...I)}

  ${_.mainStart()}
    ${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let m = global_idx / uniforms.N;
    let n = global_idx % uniforms.N;

    var value = ${x}(0);
    for (var k: u32 = 0u; k < uniforms.K; k++) {
      ${g}
    }

    ${w}
    ${v!=null?`let cOffset = ${v.broadcastedIndicesToOffset("vec2(m, n)",T)}; value += ${x}(uniforms.beta) * ${v.getByOffset("cOffset")};`:""}
    output[global_idx] = value;
  }`},y=_=>{let g=S("a",e[0].dataType,e[0].dims),w=S("b",e[1].dataType,e[1].dims),$=null,b=[g,w];e.length===3&&($=S("c",e[2].dataType,e[2].dims.length),b.push($));let x=O("output",e[0].dataType,o.length);b.push(x);let v=[{name:"num_tile_n",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}],I="",T="";t.transA&&t.transB?(T=`
      var col = tile_row_start + local_id.x;
      var row = k_start + local_id.y;
      if (col < uniforms.M && row < uniforms.K) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${g.type.value}(0);
      }

      col = k_start + local_id.x;
      row = tile_col_start + local_id.y;
      if (col < uniforms.K && row < uniforms.N) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.K + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${w.type.value}(0);
      }
      `,I="value += tile_a[k][local_id.y] * tile_b[local_id.x][k];"):t.transA&&!t.transB?(T=`
      var col = tile_row_start + local_id.x;
      var row = k_start + local_id.y;
      if (col < uniforms.M && row < uniforms.K) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${g.type.value}(0);
      }

      col = tile_col_start + local_id.x;
      row = k_start + local_id.y;
      if (col < uniforms.N && row < uniforms.K) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.N + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${w.type.value}(0);
      }
      `,I="value += tile_a[k][local_id.y] * tile_b[k][local_id.x];"):!t.transA&&t.transB?(T=`
      var col = k_start + local_id.x;
      var row = tile_row_start + local_id.y;
      if (col < uniforms.K && row < uniforms.M) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.K + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${g.type.value}(0);
      }

      col = k_start + local_id.x;
      row = tile_col_start + local_id.y;
      if (col < uniforms.K && row < uniforms.N) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.K + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${w.type.value}(0);
      }
      `,I="value += tile_a[local_id.y][k] * tile_b[local_id.x][k];"):!t.transA&&!t.transB&&(T=`
      var col = k_start + local_id.x;
      var row = tile_row_start + local_id.y;
      if (col < uniforms.K && row < uniforms.M) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.K + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${g.type.value}(0);
      }

      col = tile_col_start + local_id.x;
      row = k_start + local_id.y;
      if (col < uniforms.N && row < uniforms.K) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.N + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${w.type.value}(0);
      }
      `,I="value += tile_a[local_id.y][k] * tile_b[k][local_id.x];");let C=t.alpha===1?"":"value *= uniforms.alpha;";return`
  ${_.registerUniforms(v).declareVariables(...b)}
  var<workgroup> tile_a: array<array<${g.type.storage}, ${u}>, ${u}>;
  var<workgroup> tile_b: array<array<${w.type.storage}, ${u}>, ${u}>;
  ${_.mainStart([u,u,1])}
    let tile_col_start = (workgroup_index % uniforms.num_tile_n) * ${u};
    let tile_row_start = (workgroup_index / uniforms.num_tile_n) * ${u};
    let num_tiles = (uniforms.K - 1) / ${u} + 1;
    var k_start = 0u;
    var value = ${x.type.value}(0);
    for (var t: u32 = 0u; t < num_tiles; t++) {
      ${T}
      k_start = k_start + ${u};
      workgroupBarrier();

      for (var k: u32 = 0u; k < ${u}; k++) {
        ${I}
      }
      workgroupBarrier();
    }

    ${C}
    let m = tile_row_start + local_id.y;
    let n = tile_col_start + local_id.x;
    ${$!=null?`let cOffset = ${$.broadcastedIndicesToOffset("vec2(m, n)",x)}; value += ${x.type.value}(uniforms.beta) * ${$.getByOffset("cOffset")};`:""}
    if (m < uniforms.M && n < uniforms.N) {
      output[m * uniforms.N + n] = value;
    }
  }`};return p?{name:"GemmShared",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:f},getRunData:()=>({outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:l*d},programUniforms:c}),getShaderSource:y}:{name:"Gemm",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:f},getRunData:()=>({outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(h/64)},programUniforms:c}),getShaderSource:m}},bu=e=>{let t=e.transA,i=e.transB,r=e.alpha,a=e.beta;return{transA:t,transB:i,alpha:r,beta:a,cacheKey:`${e.transA};${e.transB};${e.alpha===1}`}},vu=(e,t)=>{$u(e.inputs),e.compute(wu(e.inputs,t))}}),Te,Be,Fe,je,xu,ku,Iu,Su,Tu,zu,Eu,Cu,Bu,Au,Kp=E(()=>{V(),L(),re(),W(),[Te,Be,Fe,je]=[0,1,2,3],xu=e=>{if(e[0].dims.length!==4)throw new Error("only 4-D tensor is supported.");if(e[0].dims.length!==e[1].dims.length)throw new Error("input dimensions must be equal to grid dimensions");if(e[0].dims.length-2!==e[1].dims[e[1].dims.length-1])throw new Error(`last dimension of grid must be equal to ${e[0].dims.length-2}`);if(e[0].dims[0]!==e[1].dims[0])throw new Error("grid batch size must match input batch size")},ku=`
  fn gs_get_cubic_coeffs(x: f32) -> vec4<f32> {
    let cubic_alpha = -0.75f;
    let x_abs = abs(x);
    var coeffs: vec4<f32>;
    coeffs[0] = (((cubic_alpha * (x_abs + 1) - 5 * cubic_alpha) * (x_abs + 1) + 8 * cubic_alpha) * (x_abs + 1) - 4 * cubic_alpha);
    coeffs[1] = (((cubic_alpha + 2) * x_abs - (cubic_alpha + 3)) * x_abs * x_abs + 1);
    coeffs[2] = (((cubic_alpha + 2) * (1 - x_abs) - (cubic_alpha + 3)) * (1 - x_abs) * (1 - x_abs) + 1);
    coeffs[3] = (((cubic_alpha * (2 - x_abs) - 5 * cubic_alpha) * (2 - x_abs) + 8 * cubic_alpha) * (2 - x_abs) - 4 * cubic_alpha);
    return coeffs;
  }
`,Iu=e=>`
  fn gs_bicubic_interpolate(p: mat4x4<${e}>, x: f32, y: f32) -> ${e} {
    var v: vec4<f32>;
    var coeffs = gs_get_cubic_coeffs(x);
    for (var i = 0; i < 4; i++) {
      v[i] = coeffs[0] * p[i][0] + coeffs[1] * p[i][1] + coeffs[2] * p[i][2] + coeffs[3] * p[i][3];
    }
    coeffs = gs_get_cubic_coeffs(y);
    let pixel = ${e}(coeffs[0] * v[0] + coeffs[1] * v[1] + coeffs[2] * v[2] + coeffs[3] * v[3]);
    return pixel;
  }
`,Su=e=>`
  fn gs_denormalize(n: f32, length: i32) -> f32 {
    ${e.alignCorners===0?`
    // alignCorners: false => [-1, 1] to [-0.5, length - 0.5]
    return ((n + 1.0) * f32(length) - 1.0) / 2.0;
    `:`
    // alignCorners: true => [-1, 1] to [0, length - 1]
    return (n + 1.0) / 2.0 * (f32(length - 1));
    `}
  }
`,Tu=e=>`
  ${e.paddingMode==="reflection"?`
      fn gs_reflect(x: i32, x_min: f32, x_max: f32) -> u32 {
        var dx = 0.0;
        var fx = f32(x);
        let range = x_max - x_min;
        if (fx < x_min) {
          dx = x_min - fx;
          let n = u32(dx / range);
          let r = dx - f32(n) * range;
          if (n % 2 == 0) {
            fx = x_min + r;
          } else {
            fx = x_max - r;
          }
        } else if (fx > x_max) {
          dx = fx - x_max;
          let n = u32(dx / range);
          let r = dx - f32(n) * range;
          if (n % 2 == 0) {
            fx = x_max - r;
          } else {
            fx = x_min + r;
          }
        }
        return u32(fx);
      }`:""}
`,zu=(e,t,i)=>`
  fn pixel_at_grid(r: i32, c: i32, H: i32, W: i32, batch: u32, channel: u32, border: vec4<f32>) -> ${t} {
     var pixel = ${t}(0);
     var indices = vec4<u32>(0);
     indices[${Te}] = batch;
     indices[${Be}] = channel;`+(()=>{switch(i.paddingMode){case"zeros":return`
          if (r >= 0 && r < H && c >=0 && c < W) {
            indices[${Fe}] = u32(r);
            indices[${je}] = u32(c);
          } else {
            return ${t}(0);
          }
        `;case"border":return`
          indices[${Fe}] = u32(clamp(r, 0, H - 1));
          indices[${je}] = u32(clamp(c, 0, W - 1));
        `;case"reflection":return`
          indices[${Fe}] = gs_reflect(r, border[1], border[3]);
          indices[${je}] = gs_reflect(c, border[0], border[2]);
        `;default:throw new Error(`padding mode ${i.paddingMode} is not supported`)}})()+`
    return ${e.getByIndices("indices")};
  }
`,Eu=(e,t,i)=>(()=>{switch(i.mode){case"nearest":return`
          let result = pixel_at_grid(i32(round(y)), i32(round(x)), H_in, W_in, indices[${Te}], indices[${Be}], border);
        `;case"bilinear":return`
          let x1 = i32(floor(x));
          let y1 = i32(floor(y));
          let x2 = x1 + 1;
          let y2 = y1 + 1;

          let p11 = pixel_at_grid(y1, x1, H_in, W_in, indices[${Te}], indices[${Be}], border);
          let p12 = pixel_at_grid(y1, x2, H_in, W_in, indices[${Te}], indices[${Be}], border);
          let p21 = pixel_at_grid(y2, x1, H_in, W_in, indices[${Te}], indices[${Be}], border);
          let p22 = pixel_at_grid(y2, x2, H_in, W_in, indices[${Te}], indices[${Be}], border);

          let dx2 = ${t}(f32(x2) - x);
          let dx1 = ${t}(x - f32(x1));
          let dy2 = ${t}(f32(y2) - y);
          let dy1 = ${t}(y - f32(y1));
          let result = dy2 * (dx2 * p11 + dx1 * p12) + dy1 * (dx2 * p21 + dx1 * p22);
        `;case"bicubic":return`
          let x0 = i32(floor(x)) - 1;
          let y0 = i32(floor(y)) - 1;
          var p: mat4x4<${t}>;
          for (var h = 0; h < 4; h++) {
            for (var w = 0; w < 4; w++) {
              p[h][w] = pixel_at_grid(h + y0, w + x0, H_in, W_in, indices[${Te}], indices[${Be}], border);
            }
          }

          let dx = x - f32(x0 + 1);
          let dy = y - f32(y0 + 1);
          let result = gs_bicubic_interpolate(p, dx, dy);
        `;default:throw new Error(`mode ${i.mode} is not supported`)}})()+`${e.setByOffset("global_idx","result")}`,Cu=(e,t)=>{let i=S("x",e[0].dataType,e[0].dims.length),r=[e[1].dims[0],e[1].dims[1],e[1].dims[2]],a=S("grid",e[1].dataType,r.length,2),n=[e[0].dims[0],e[0].dims[1],e[1].dims[1],e[1].dims[2]];t.format==="NHWC"&&(n=[e[0].dims[0],e[1].dims[1],e[1].dims[2],e[0].dims[3]],[Te,Be,Fe,je]=[0,3,1,2]);let s=O("output",e[0].dataType,n.length),o=i.type.value,u=k.size(n),l=[{type:12,data:u},...M(e[0].dims,r,n)],d=p=>`
  ${p.registerUniform("output_size","u32").declareVariables(i,a,s)}
  ${ku}
  ${Iu(o)}
  ${Su(t)}
  ${Tu(t)}
  ${zu(i,o,t)}

  ${p.mainStart()}
    ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let H_in = i32(uniforms.x_shape[${Fe}]);
      let W_in = i32(uniforms.x_shape[${je}]);

      ${t.alignCorners===0?`
      let x_min = -0.5;
      let x_max = f32(W_in) - 0.5;
      let y_min = -0.5;
      let y_max = f32(H_in) - 0.5;
      `:`
      let x_min = 0.0;
      let x_max = f32(W_in) - 1.0;
      let y_min = 0.0;
      let y_max = f32(H_in) - 1.0;
      `};
      let border = vec4<f32>(x_min, y_min, x_max, y_max);

      let indices = ${s.offsetToIndices("global_idx")};
      var grid_indices = vec3<u32>(indices[${Te}], indices[${Fe}], indices[${je}]);
      let nxy = ${a.getByIndices("grid_indices")};
      var x = gs_denormalize(f32(nxy[0]), W_in);
      var y = gs_denormalize(f32(nxy[1]), H_in);

      ${Eu(s,o,t)}
  }`;return{name:"GridSample",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:["type","type"]},getRunData:p=>{let h=k.size(n);return{outputs:[{dims:n,dataType:p[0].dataType}],dispatchGroup:{x:Math.ceil(h/64)},programUniforms:l}},getShaderSource:d}},Bu=(e,t)=>{xu(e.inputs),e.compute(Cu(e.inputs,t))},Au=e=>Q({alignCorners:e.align_corners,mode:e.mode,paddingMode:e.padding_mode,format:e.format})}),le,Ou,Ru,ur,Du,wt,Mu,Pu=E(()=>{V(),L(),re(),zi(),qi(),W(),Re(),le=(e,t)=>e.length>t&&e[t].dims.length>0?e[t]:void 0,Ou=(e,t)=>{let i=e[0],r=le(e,1),a=le(e,2),n=le(e,3),s=le(e,4),o=le(e,5),u=le(e,6),l=le(e,7);if(i.dims.length!==3&&i.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let d=i.dims[0],p=i.dims[1],h=i.dims.length===3?i.dims[2]:t.numHeads*i.dims[4],c=p,f=0,m=0,y=Math.floor(h/t.numHeads);if(u&&l&&k.size(u.dims)&&k.size(l.dims)){if(u.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(u.dims[0]!==d||u.dims[1]!==t.numHeads||u.dims[3]!==y)throw new Error('Input "past_key" shape (batch_size, num_heads, past_sequence_length, head_size)');if(l.dims[0]!==d||l.dims[1]!==t.numHeads||l.dims[3]!==y)throw new Error('Input "past_value" shape (batch_size, num_heads, past_sequence_length, head_size)');if(u.dims[2]!==l.dims[2])throw new Error('Input "past_key" and "past_value" shall have same dim 2 (past_sequence_length)');if(l.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');f=u.dims[2],m=u.dims[2]}else if(u&&k.size(u.dims)||l&&k.size(l.dims))throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let _;if(r&&k.size(r.dims)>0){if(i.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(r.dims.length<3||r.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(i.dims[0]!==r.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(r.dims.length===3){if(r.dims[2]!==i.dims[2])throw new Error('Input "query" and "key" shall have same dim 2 (hidden_size)');_=2,c=r.dims[1]}else if(r.dims.length===5){if(r.dims[2]!==t.numHeads||r.dims[3]!==2||r.dims[4]!==y)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(a)throw new Error('Expect "value" be none when "key" has packed kv format.');_=5,c=r.dims[1]}else{if(r.dims[1]!==t.numHeads||r.dims[3]!==y)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');_=0,c=r.dims[2]}}else{if(i.dims.length!==5)throw new Error('Input "query" is expected to have 5 dimensions when key is empty');if(i.dims[2]!==t.numHeads||i.dims[3]!==3)throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');_=3}if(n&&k.size(n.dims)>0){if(n.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimension');if(r&&r.dims.length===5&&r.dims[3]===2)throw new Error("bias is not allowed for packed kv.")}let g=f+c,w=0;if(s&&k.size(s.dims)>0){w=8;let v=s.dims;throw v.length===1?v[0]===d?w=1:v[0]===3*d+2&&(w=3):v.length===2&&v[0]===d&&v[1]===g&&(w=5),w===8?new Error('Input "key_padding_mask" shape shall be (batch_size) or (batch_size, total_sequence_length)'):new Error("Mask not supported")}let $=!1,b=h;if(a&&k.size(a.dims)>0){if(a.dims.length!==3&&a.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(i.dims[0]!==a.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(a.dims.length===3){if(c!==a.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');b=a.dims[2]}else{if(c!==a.dims[2])throw new Error('Input "key" and "value" shall have the same dim 2 (kv_sequence_length)');b=a.dims[1]*a.dims[3],$=!0}}let x=!1;if(s&&k.size(s.dims)>0)throw new Error("Key padding mask is not supported");if(o&&k.size(o.dims)>0){if(o.dims.length!==4)throw new Error('Input "attention_bias" is expected to have 4 dimensions');if(o.dims[0]!==d||o.dims[1]!==t.numHeads||o.dims[2]!==p||o.dims[3]!==g)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:d,sequenceLength:p,pastSequenceLength:f,kvSequenceLength:c,totalSequenceLength:g,maxSequenceLength:m,inputHiddenSize:0,hiddenSize:h,vHiddenSize:b,headSize:y,vHeadSize:Math.floor(b/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:w,scale:t.scale,broadcastResPosBias:x,passPastInKv:$,qkvFormat:_}},Ru=e=>Q({...e}),ur=Q({perm:[0,2,1,3]}),Du=(e,t,i,r,a,n,s)=>{let o=[r,a,n],u=k.size(o),l=[{type:12,data:u},{type:12,data:s},{type:12,data:n}],d=p=>{let h=O("qkv_with_bias",t.dataType,o),c=S("qkv",t.dataType,o),f=S("bias",i.dataType,o),m=[{name:"output_size",type:"u32"},{name:"bias_offset",type:"u32"},{name:"hidden_size",type:"u32"}];return`
  ${p.registerUniforms(m).declareVariables(c,f,h)}
  ${p.mainStart()}
    ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let bias_offset_idx = (global_idx % uniforms.hidden_size) + uniforms.bias_offset;

    qkv_with_bias[global_idx] = qkv[global_idx] + bias[bias_offset_idx];
  }`};return e.compute({name:"MultiHeadAttentionAddBias",shaderCache:{inputDependencies:["type","type"]},getRunData:()=>({outputs:[{dims:o,dataType:t.dataType,gpuDataType:0}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:l}),getShaderSource:d},{inputs:[t,i],outputs:[-1]})[0]},wt=(e,t,i,r,a,n,s,o)=>{let u=n;if(s&&k.size(s.dims)>0){if(r===1)throw new Error("AddBiasReshape is not implemented. Please export your model with packed QKV or KV");return u=Du(e,n,s,t,r,i*a,o),u=u.reshape([t,r,i,a]),i===1||r===1?u:e.compute(me(u,ur.perm),{inputs:[u],outputs:[-1]})[0]}else return n.dims.length===3&&(u=n.reshape([t,r,i,a])),i===1||r===1?u:e.compute(me(u,ur.perm),{inputs:[u],outputs:[-1]})[0]},Mu=(e,t)=>{let i=Ou(e.inputs,t),r=e.inputs[0],a=le(e.inputs,1),n=le(e.inputs,2),s=le(e.inputs,3),o=le(e.inputs,4),u=le(e.inputs,5),l=le(e.inputs,6),d=le(e.inputs,7);if(r.dims.length===5)throw new Error("Packed QKV is not implemented");if((a==null?void 0:a.dims.length)===5)throw new Error("Packed KV is not implemented");let p=a&&n&&a.dims.length===4&&n.dims.length===4,h=wt(e,i.batchSize,i.numHeads,i.sequenceLength,i.headSize,r,s,0);if(p)return mt(e,h,a,n,o,void 0,l,d,u,i);if(!a||!n)throw new Error("key and value must be provided");let c=wt(e,i.batchSize,i.numHeads,i.kvSequenceLength,i.headSize,a,s,i.hiddenSize),f=wt(e,i.batchSize,i.numHeads,i.kvSequenceLength,i.vHeadSize,n,s,2*i.hiddenSize);mt(e,h,c,f,o,void 0,l,d,u,i)}}),Uu,qu,Nu,Vu,lr,Lu,Wu,Gu=E(()=>{V(),L(),re(),W(),Uu=e=>{if(!e||e.length<1)throw new Error("too few inputs")},qu=(e,t)=>{let i=[],r=t.numOutputs;return e[1].dims[0]>0&&(e[1].getBigInt64Array().forEach(a=>i.push(Number(a))),r=i.length),Q({numOutputs:r,axis:t.axis,splitSizes:i})},Nu=e=>`
fn calculateOutputIndex(index: u32) -> u32 {
    for (var i: u32 = 0u; i < ${e}u; i += 1u ) {
    if (index < ${R("uniforms.size_in_split_axis","i",e)}) {
        return i;
    }
    }
    return ${e}u;
}`,Vu=e=>{let t=e.length,i=[];for(let r=0;r<t;++r){let a=e[r].setByIndices("indices","input[global_idx]");t===1?i.push(a):r===0?i.push(`if (output_number == ${r}u) { ${a} }`):r===t-1?i.push(`else { ${a} }`):i.push(`else if (output_number == ${r}) { ${a} }`)}return`
      fn writeBufferData(output_number: u32, indices: ${e[0].type.indices}, global_idx: u32) {
        ${i.join(`
`)}
      }`},lr=(e,t)=>{let i=e[0].dims,r=k.size(i),a=e[0].dataType,n=k.normalizeAxis(t.axis,i.length),s=new Array(t.numOutputs),o=S("input",a,i.length),u=new Array(t.numOutputs),l=[],d=[],p=0,h=[{type:12,data:r}];for(let f=0;f<t.numOutputs;f++){p+=t.splitSizes[f],u[f]=p;let m=i.slice();m[n]=t.splitSizes[f],d.push(m),s[f]=O(`output${f}`,a,m.length),l.push({dims:d[f],dataType:e[0].dataType})}h.push({type:12,data:u},...M(i,...d));let c=f=>`
  ${f.registerUniform("input_size","u32").registerUniform("size_in_split_axis","u32",u.length).declareVariables(o,...s)}
  ${Nu(u.length)}
  ${Vu(s)}

  ${f.mainStart()}
    ${f.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.input_size")}

    var indices = ${o.offsetToIndices("global_idx")};
    var index = ${o.indicesGet("indices",n)};
    let output_number = calculateOutputIndex(index);
    if (output_number != 0) {
      index -= ${R("uniforms.size_in_split_axis","output_number - 1u",u.length)};
      ${o.indicesSet("indices",n,"index")};
    }
    writeBufferData(output_number, indices, global_idx);
  }`;return{name:"Split",shaderCache:{hint:t.cacheKey,inputDependencies:["rank"]},getShaderSource:c,getRunData:()=>({outputs:l,dispatchGroup:{x:Math.ceil(r/64)},programUniforms:h})}},Lu=(e,t)=>{Uu(e.inputs);let i=e.inputs.length===1?t:qu(e.inputs,t);e.compute(lr(e.inputs,i),{inputs:[0]})},Wu=e=>{let t=e.axis,i=e.splitSizes,r=e.numOutputs<0?i.length:e.numOutputs;if(r!==i.length)throw new Error("numOutputs and splitSizes lengh must be equal");return Q({axis:t,numOutputs:r,splitSizes:i})}}),Hu,Wt,Fu,ju=E(()=>{V(),L(),re(),W(),Hu=(e,t)=>{let[i,r,a,n]=e,{numHeads:s,rotaryEmbeddingDim:o}=t;if(i.dims.length!==3&&i.dims.length!==4)throw new Error(`Input 'x' is expected to have 3 or 4 dimensions, got ${i.dims.length}`);if(!k.areEqual(r.dims,[])&&!k.areEqual(r.dims,[1])&&r.dims.length!==2)throw new Error(`Input 'position_ids' is expected to have 0, 1, or 2 dimensions, got ${r.dims.length}`);if(a.dims.length!==2)throw new Error(`Input 'cos_cache' is expected to have 2 dimensions, got ${a.dims.length}`);if(n.dims.length!==2)throw new Error(`Input 'sin_cache' is expected to have 2 dimensions, got ${n.dims.length}`);if(!k.areEqual(a.dims,n.dims))throw new Error("Inputs 'cos_cache' and 'sin_cache' are expected to have the same shape");if(o>0&&s===0)throw new Error("num_heads must be provided if rotary_embedding_dim is specified");let u=i.dims[0],l=i.dims[i.dims.length-2],d=a.dims[0],p=k.sizeFromDimension(i.dims,1)/l,h=o===0?a.dims[1]*2:p/s;if(o>h)throw new Error("rotary_embedding_dim must be less than or equal to head_size");if(r.dims.length===2){if(u!==r.dims[0])throw new Error(`Input 'position_ids' dimension 0 should be of size batch_size, got ${r.dims[0]}`);if(l!==r.dims[1])throw new Error(`Input 'position_ids' dimension 1 should be of size sequence_length, got ${r.dims[1]}`)}if(h/2!==a.dims[1]&&o/2!==a.dims[1])throw new Error(`Input 'cos_cache' dimension 1 should be same as head_size / 2 or rotary_embedding_dim / 2, got ${a.dims[1]}`);if(l>d)throw new Error("Updating cos_cache and sin_cache in RotaryEmbedding is not currently supported")},Wt=(e,t)=>{let{interleaved:i,numHeads:r,rotaryEmbeddingDim:a,scale:n}=t,s=e[0].dims[0],o=k.sizeFromDimension(e[0].dims,1),u=e[0].dims[e[0].dims.length-2],l=o/u,d=e[2].dims[1],p=a===0?d*2:l/r,h=new Array(s,u,l/p,p-d),c=k.computeStrides(h),f=[{type:1,data:n},{type:12,data:h},{type:12,data:c},...e[0].dims.length===3?new Array({type:12,data:[o,l,p,1]}):[],...e[0].dims.length===4?new Array({type:12,data:[o,p,u*p,1]}):[],...M(e[0].dims,e[1].dims,e[2].dims,e[3].dims,e[0].dims)],m=y=>{let _=S("input",e[0].dataType,e[0].dims.length),g=S("position_ids",e[1].dataType,e[1].dims.length),w=S("cos_cache",e[2].dataType,e[2].dims.length),$=S("sin_cache",e[3].dataType,e[3].dims.length),b=O("output",e[0].dataType,e[0].dims.length);return y.registerUniforms([{name:"scale",type:"f32"},{name:"global_shape",type:"u32",length:h.length},{name:"global_strides",type:"u32",length:c.length},{name:"input_output_strides",type:"u32",length:c.length}]),`
        ${y.declareVariables(_,g,w,$,b)}

        ${y.mainStart(it)}
          let half_rotary_emb_dim = uniforms.${w.name}_shape[1];
          let bsnh = global_idx / uniforms.global_strides % uniforms.global_shape;
          let size = uniforms.global_shape[0] * uniforms.global_strides[0];
          ${y.guardAgainstOutOfBoundsWorkgroupSizes("size")}

          if (bsnh[3] < half_rotary_emb_dim) {
            let position_ids_idx =
                ${g.broadcastedIndicesToOffset("bsnh.xy",O("",g.type.tensor,2))};
            let position_id =
                u32(${g.getByOffset("position_ids_idx")}) + select(0, bsnh[1], position_ids_idx == 0);
            let i = dot(bsnh, uniforms.input_output_strides) + select(0, bsnh[3], ${i});
            let j = i + select(half_rotary_emb_dim, 1, ${i});
            let re = ${_.getByOffset("i")} * ${w.get("position_id","bsnh[3]")} -
                ${_.getByOffset("j")} * ${$.get("position_id","bsnh[3]")};
            ${b.setByOffset("i","re")}
            let im = ${_.getByOffset("i")} * ${$.get("position_id","bsnh[3]")} +
                ${_.getByOffset("j")} * ${w.get("position_id","bsnh[3]")};
            ${b.setByOffset("j","im")}
          } else {
            let k = dot(bsnh, uniforms.input_output_strides) + half_rotary_emb_dim;
            ${b.setByOffset("k",_.getByOffset("k"))}
          }
        }`};return{name:"RotaryEmbedding",shaderCache:{hint:Q({interleaved:i}).cacheKey,inputDependencies:["rank","rank","rank","rank"]},getShaderSource:m,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(k.size(h)/it)},programUniforms:f})}},Fu=(e,t)=>{Hu(e.inputs,t),e.compute(Wt(e.inputs,t))}}),Ku,Zu,dr,Qu,Xu,Zp=E(()=>{re(),V(),qi(),Pu(),Gu(),Re(),ju(),W(),Ku=(e,t)=>{if(t.doRotary&&e.length<=7)throw new Error("cos_cache and sin_cache inputs are required if do_rotary is specified");let i=e[0],r=e[1],a=e[2],n=e[3],s=e[4];if(t.doRotary!==0&&e.length<=7)throw new Error("cos_cast and sin_cache are expected if do_rotary attribute is non-zero");if(t.localWindowSize!==-1)throw new Error("Local attention is not supported");if(t.softcap!==0)throw new Error("Softcap is not supported");if(t.rotaryInterleaved!==0)throw new Error("Rotary interleaved is not supported");if(t.smoothSoftmax)throw new Error("Smooth softmax is not supported");if(i.dims.length!==3&&i.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let o=!1,u=i.dims[0],l=i.dims[1],d=i.dims.length===3?o?i.dims[2]/3:i.dims[2]:t.numHeads*i.dims[4],p=l,h=0,c=!r||r.dims.length===0,f=Math.floor(c?d/(t.numHeads+2*t.kvNumHeads):d/t.numHeads);c&&(d=f*t.numHeads);let m=n&&n.dims.length!==0,y=s&&s.dims.length!==0;if(m&&n.dims.length===4&&n.dims[0]===u&&n.dims[1]!==t.kvNumHeads&&n.dims[2]===t.kvNumHeads&&n.dims[3]===f)throw new Error("BSNH pastKey/pastValue is not supported");if(m&&y){if(n.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(s.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');h=n.dims[2]}else if(m||y)throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let _=1;if(r&&r.dims.length>0){if(i.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(r.dims.length<3||r.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(i.dims[0]!==r.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(r.dims.length===3){if(i.dims[2]%r.dims[2]!==0)throw new Error('Dimension 2 of "query" should be a multiple of "key"');p=r.dims[1]}else if(r.dims.length===5){if(r.dims[2]!==t.numHeads||r.dims[3]!==2||r.dims[4]!==f)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(a)throw new Error('Expect "value" be none when "key" has packed kv format.');p=r.dims[1]}else{if(r.dims[1]!==t.numHeads||r.dims[3]!==f)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');p=r.dims[2]}}else{if(i.dims.length!==3&&i.dims.length!==5)throw new Error('Input "query" is expected to have 3 or 5 dimensions when key is empty');if(i.dims.length===5&&(i.dims[2]!==t.numHeads||i.dims[3]!==3))throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');_=3}let g=0,w=!1,$=t.kvNumHeads?f*t.kvNumHeads:d;if(a&&a.dims.length>0){if(a.dims.length!==3&&a.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(i.dims[0]!==a.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(a.dims.length===3){if(p!==a.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');$=a.dims[2]}else{if(p!==a.dims[2])throw new Error('Input "past_key" and "past_value" shall have the same dim 2 (kv_sequence_length)');$=a.dims[1]*a.dims[3],w=!0}}let b=e.length>4?e[5]:void 0;if(b&&b.dims.length!==1&&b.dims[0]!==u)throw new Error('Input "seqlens" is expected to have 1 dimension and the same dim 0 as batch_size');return{batchSize:u,sequenceLength:l,pastSequenceLength:h,kvSequenceLength:p,totalSequenceLength:-1,maxSequenceLength:-1,inputHiddenSize:0,hiddenSize:d,vHiddenSize:$,headSize:f,vHeadSize:Math.floor($/t.kvNumHeads),numHeads:t.numHeads,kvNumHeads:t.kvNumHeads,nReps:t.numHeads/t.kvNumHeads,pastPresentShareBuffer:!1,maskType:g,scale:t.scale,broadcastResPosBias:!1,passPastInKv:w,qkvFormat:_}},Zu=Q({perm:[0,2,1,3]}),dr=(e,t,i)=>{let r=t,a=i.kvNumHeads;return t.dims.length===3&&i.kvSequenceLength!==0&&(r=t.reshape([i.batchSize,i.kvSequenceLength,a,i.headSize]),r=e.compute(me(r,Zu.perm),{inputs:[r],outputs:[-1]})[0]),r},Qu=(e,t,i,r)=>{let a=7,n=["type","type"],s=[e*t],o=e*t,u=[{type:12,data:o},{type:12,data:t},{type:12,data:e}],l=d=>{let p=S("seq_lens",i.dataType,i.dims),h=S("total_seq_lens",r.dataType,r.dims),c=O("pos_ids",a,s),f=[{name:"output_size",type:"u32"},{name:"sequence_length",type:"u32"},{name:"batch_size",type:"u32"}];return`
  ${d.registerUniforms(f).declareVariables(p,h,c)}
  ${d.mainStart()}
    ${d.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let total_sequence_length = u32(${h.getByOffset("0")});
    let is_subsequent_prompt = uniforms.sequence_length > 1 && uniforms.sequence_length != total_sequence_length;
    let is_first_prompt = !is_subsequent_prompt && uniforms.sequence_length == total_sequence_length;
    let batch_idx = global_idx / uniforms.sequence_length;
    let sequence_idx = i32(global_idx % uniforms.sequence_length);
    var pos_id: i32 = 0;
    let seqlen = ${p.getByOffset("batch_idx")};
    let total_seqlen = seqlen + 1;
    if (is_first_prompt) {
      if (sequence_idx < total_seqlen) {
        pos_id = sequence_idx;
      } else {
        pos_id = 1;
      }
      ${c.setByOffset("global_idx","pos_id")}
    } else if (is_subsequent_prompt) {
      let past_seqlen = total_seqlen - i32(uniforms.sequence_length);
      if (past_seqlen + sequence_idx < total_seqlen) {
        pos_id = past_seqlen + sequence_idx;
      } else {
        pos_id = 1;
      }
      ${c.setByOffset("global_idx","pos_id")}
    } else if (global_idx < uniforms.batch_size) {
      ${c.setByOffset("global_idx","seqlen")}
    };
  }
  `};return{name:"GeneratePositionIds",shaderCache:{hint:`${e};${t}`,inputDependencies:n},getRunData:()=>({outputs:[{dims:s,dataType:a}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:u}),getShaderSource:l}},Xu=(e,t)=>{var $;let i=Ku(e.inputs,t);if(e.inputs[0].dims.length===5)throw new Error("Packed QKV is not implemented");if((($=e.inputs[1])==null?void 0:$.dims.length)===5)throw new Error("Packed KV is not implemented");let r=e.inputs[0],a=e.inputs[1]&&e.inputs[1].dims.length>0?e.inputs[1]:void 0,n=e.inputs[2]&&e.inputs[2].dims.length>0?e.inputs[2]:void 0,s=e.inputs[3]&&e.inputs[3].dims.length!==0?e.inputs[3]:void 0,o=e.inputs[4]&&e.inputs[4].dims.length!==0?e.inputs[4]:void 0,u=e.inputs.length>4?e.inputs[5]:void 0,l=e.inputs.length>5?e.inputs[6]:void 0,d=i.kvNumHeads?i.kvNumHeads:i.numHeads,p=Q({axis:2,numOutputs:3,splitSizes:[i.numHeads*i.headSize,d*i.headSize,d*i.headSize]}),[h,c,f]=!a&&!n?e.compute(lr([r],p),{inputs:[r],outputs:[-1,-1,-1]}):[r,a,n],m,y;if(t.doRotary){let b=e.compute(Qu(i.batchSize,i.sequenceLength,u,l),{inputs:[u,l],outputs:[-1]})[0],x=e.inputs[7],v=e.inputs[8],I=Q({interleaved:t.rotaryInterleaved!==0,numHeads:i.numHeads,rotaryEmbeddingDim:0,scale:t.scale}),T=[h,b,x,v],C=[-1];m=e.compute(Wt(T,I),{inputs:T,outputs:C})[0],T.splice(0,1,c);let q=Q({interleaved:t.rotaryInterleaved!==0,numHeads:i.kvNumHeads,rotaryEmbeddingDim:0,scale:t.scale});y=e.compute(Wt(T,q),{inputs:T,outputs:C})[0]}let _=wt(e,i.batchSize,i.numHeads,i.sequenceLength,i.headSize,t.doRotary?m:h,void 0,0),g=dr(e,t.doRotary?y:c,i),w=dr(e,f,i);mt(e,_,g,w,void 0,void 0,s,o,void 0,i,u,l)}}),pr,Yu,Ju,el,Qp=E(()=>{V(),L(),Re(),W(),pr=(e,t,i,r,a,n,s,o)=>{let u=ie(n),l=u===1?"f32":`vec${u}f`,d=u===1?"vec2f":`mat2x${u}f`,p=a*s,h=64;p===1&&(h=256);let c=[a,s,n/u],f=[a,s,2],m=["rank","type","type"],y=[];y.push(...M(c,f));let _=g=>{let w=S("x",t.dataType,3,u),$=S("scale",i.dataType,i.dims),b=S("bias",r.dataType,r.dims),x=O("output",1,3,2),v=[w,$,b,x];return`
  var<workgroup> workgroup_shared : array<${d}, ${h}>;
  const workgroup_size = ${h}u;
  ${g.declareVariables(...v)}
  ${g.mainStart(h)}
    let batch = workgroup_index / uniforms.x_shape[1];
    let channel = workgroup_index % uniforms.x_shape[1];
    let hight = uniforms.x_shape[2];
    // initialize workgroup memory
    var sum = ${l}(0);
    var squared_sum = ${l}(0);
    for (var h = local_idx; h < hight; h += workgroup_size) {
      let value = ${l}(${w.get("batch","channel","h")});
      sum += value;
      squared_sum += value * value;
    }
    workgroup_shared[local_idx] = ${d}(sum, squared_sum);
    workgroupBarrier();

    for (var currSize = workgroup_size >> 1;  currSize > 0; currSize = currSize >> 1) {
      if (local_idx < currSize) {
        workgroup_shared[local_idx] = workgroup_shared[local_idx] + workgroup_shared[local_idx + currSize];
      }
      workgroupBarrier();
    }
    if (local_idx == 0) {
      let sum_final = ${Oe("workgroup_shared[0][0]",u)} / f32(hight * ${u});
      let squared_sum_final = ${Oe("workgroup_shared[0][1]",u)} / f32(hight * ${u});

      let inv_std_dev = inverseSqrt(squared_sum_final - sum_final * sum_final + f32(${o}));
      let channel_scale = inv_std_dev * f32(scale[channel]);
      let channel_shift = f32(bias[channel]) - sum_final * channel_scale;
      output[workgroup_index] = vec2f(channel_scale, channel_shift);
    }
  }`};return e.compute({name:"InstanceNormComputeChannelScaleShift",shaderCache:{hint:`${u};${o};${h}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:f,dataType:1}],dispatchGroup:{x:p},programUniforms:y}),getShaderSource:_},{inputs:[t,i,r],outputs:[-1]})[0]},Yu=(e,t,i)=>{let r=t[0].dims,a=r,n=2,s=r[0],o=r[1],u=k.sizeFromDimension(r,n),l=ie(u),d=k.size(a)/l,p=pr(e,t[0],t[1],t[2],s,u,o,i.epsilon),h=[s,o,u/l],c=[s,o],f=["type","none"],m=y=>{let _=S("x",t[0].dataType,h.length,l),g=S("scale_shift",1,c.length,2),w=O("output",t[0].dataType,h.length,l),$=[_,g,w];return`
  ${y.registerUniform("output_size","u32").declareVariables(...$)}
  ${y.mainStart()}
  ${y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let outputIndices = ${w.offsetToIndices("global_idx")};
      let batch = outputIndices[0];
      let channel = outputIndices[1];
      let scale_shift = ${g.getByIndices("vec2<u32>(batch, channel)")};
      let value = ${_.getByOffset("global_idx")} * ${w.type.value}(scale_shift.x) + ${w.type.value}(scale_shift.y);
      ${w.setByOffset("global_idx","value")};
  }`};e.compute({name:"InstanceNormalization",shaderCache:{hint:`${l}`,inputDependencies:f},getRunData:()=>({outputs:[{dims:a,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:[{type:12,data:d},...M(h,c,h)]}),getShaderSource:m},{inputs:[t[0],p]})},Ju=(e,t,i)=>{let r=t[0].dims,a=r,n=r[0],s=r[r.length-1],o=k.sizeFromDimension(r,1)/s,u=ie(s),l=k.size(a)/u,d=[{type:12,data:o},{type:12,data:Math.floor(s/u)}],p=["type","type"],h=!1,c=[0,r.length-1];for(let _=0;_<r.length-2;_++)h=h||r[_+1]!==1,c.push(_+1);h=h&&r[r.length-1]!==1;let f=h?e.compute(me(e.inputs[0],c),{inputs:[e.inputs[0]],outputs:[-1]})[0]:e.inputs[0].reshape(Array.from({length:r.length},(_,g)=>r[c[g]])),m=pr(e,f,t[1],t[2],n,o,s,i.epsilon),y=_=>{let g=ae(t[0].dataType),w=u===1?"vec2f":`mat${u}x2f`,$=v=>{let I=v===0?"x":"y",T=u===1?"f32":`vec${u}f`;switch(u){case 1:return`${g}(${T}(scale.${I}))`;case 2:return`vec2<${g}>(${T}(scale[0].${I}, scale[1].${I}))`;case 4:return`vec4<${g}>(${T}(scale[0].${I}, scale[1].${I}, scale[2].${I}, scale[3].${I}))`;default:throw new Error(`Not supported compoents ${u}`)}},b=S("input",t[0].dataType,t[0].dims,u),x=O("output",t[0].dataType,a,u);return`
  @group(0) @binding(0) var<storage, read> input : array<${b.type.storage}>;
  @group(0) @binding(1) var<storage, read> scale_input : array<${w}>;
  @group(0) @binding(2) var<storage, read_write> output : array<${x.type.storage}>;
  struct Uniforms {H: u32, C : u32};
  @group(0) @binding(3) var<uniform> uniforms: Uniforms;

  ${_.mainStart()}
    let current_image_number = global_idx / (uniforms.C * uniforms.H);
    let current_channel_number = global_idx % uniforms.C;

    let scale_offset = current_image_number * uniforms.C + current_channel_number;
    let scale = scale_input[scale_offset];
    output[global_idx] = fma(input[global_idx], ${$(0)}, ${$(1)});
  }`};e.compute({name:"InstanceNormalizationNHWC",shaderCache:{hint:`${u}`,inputDependencies:p},getRunData:()=>({outputs:[{dims:a,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:d}),getShaderSource:y},{inputs:[t[0],m]})},el=(e,t)=>{t.format==="NHWC"?Ju(e,e.inputs,t):Yu(e,e.inputs,t)}}),tl,il,rl,Xp=E(()=>{V(),L(),W(),tl=e=>{if(!e||e.length<2)throw new Error("layerNorm requires at least 2 inputs.")},il=(e,t,i)=>{let r=t.simplified,a=e[0].dims,n=e[1],s=!r&&e[2],o=a,u=k.normalizeAxis(t.axis,a.length),l=k.sizeToDimension(a,u),d=k.sizeFromDimension(a,u),p=k.size(n.dims),h=s?k.size(s.dims):0;if(p!==d||s&&h!==d)throw new Error(`Size of X.shape()[axis:] == ${d}.
       Size of scale and bias (if provided) must match this.
       Got scale size of ${p} and bias size of ${h}`);let c=[];for(let b=0;b<a.length;++b)b<u?c.push(a[b]):c.push(1);let f=ie(d),m=["type","type"],y=[{type:12,data:l},{type:1,data:d},{type:12,data:Math.floor(d/f)},{type:1,data:t.epsilon}];s&&m.push("type");let _=i>1,g=i>2,w=b=>{let x=ae(e[0].dataType),v=[S("x",e[0].dataType,e[0].dims,f),S("scale",n.dataType,n.dims,f)];s&&v.push(S("bias",s.dataType,s.dims,f)),v.push(O("output",e[0].dataType,o,f)),_&&v.push(O("mean_data_output",1,c)),g&&v.push(O("inv_std_output",1,c));let I=[{name:"norm_count",type:"u32"},{name:"norm_size",type:"f32"},{name:"norm_size_vectorized",type:"u32"},{name:"epsilon",type:"f32"}];return`
  ${b.registerUniforms(I).declareVariables(...v)}
  ${b.mainStart()}
    ${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.norm_count")}
    let offset = global_idx * uniforms.norm_size_vectorized;
    var mean_vector = ${Ai("f32",f)};
    var mean_square_vector = ${Ai("f32",f)};

    for (var h: u32 = 0u; h < uniforms.norm_size_vectorized; h++) {
      let value = ${rt(x,f,"x[h + offset]")};
      mean_vector += value;
      mean_square_vector += value * value;
    }
    let mean = ${Oe("mean_vector",f)} / uniforms.norm_size;
    let inv_std_dev = inverseSqrt(${Oe("mean_square_vector",f)} / uniforms.norm_size ${r?"":"- mean * mean"} + uniforms.epsilon);

    for (var j: u32 = 0; j < uniforms.norm_size_vectorized; j++) {
      let f32input = ${rt(x,f,"x[j + offset]")};
      let f32scale = ${rt(x,f,"scale[j]")};
      output[j + offset] = ${v[0].type.value}((f32input ${r?"":"- mean"}) * inv_std_dev * f32scale
        ${s?`+ ${rt(x,f,"bias[j]")}`:""}
      );
    }

    ${_?"mean_data_output[global_idx] = mean":""};
    ${g?"inv_std_output[global_idx] = inv_std_dev":""};
  }`},$=[{dims:o,dataType:e[0].dataType}];return _&&$.push({dims:c,dataType:1}),g&&$.push({dims:c,dataType:1}),{name:"LayerNormalization",shaderCache:{hint:`${f};${i};${r}`,inputDependencies:m},getRunData:()=>({outputs:$,dispatchGroup:{x:Math.ceil(l/64)},programUniforms:y}),getShaderSource:w}},rl=(e,t)=>{tl(e.inputs),e.compute(il(e.inputs,t,e.outputCount))}}),al,nl,Yp=E(()=>{L(),ji(),Xi(),al=e=>{if(!e||e.length!==2)throw new Error("MatMul requires 2 inputs.");if(e[0].dims[e[0].dims.length-1]!==e[1].dims[e[1].dims.length-2])throw new Error("shared dimension does not match.")},nl=e=>{al(e.inputs);let t=tt.calcShape(e.inputs[0].dims,e.inputs[1].dims,!0);if(!t)throw new Error("Can't use matmul on the given tensors");let i=t[t.length-1],r=e.inputs[0].dims[e.inputs[0].dims.length-1];if(i<8&&r<8)e.compute(Fi(e.inputs,{activation:""},t));else{let a=t[t.length-2],n=k.size(e.inputs[0].dims.slice(0,-2)),s=k.size(e.inputs[1].dims.slice(0,-2));if(n!==1&&a===1&&s===1){let o=e.inputs[0].reshape([1,n,r]),u=e.inputs[1].reshape([1,r,i]),l=[1,n,i],d=[o,u];e.compute(qt(d,{activation:""},t,l),{inputs:d})}else e.compute(qt(e.inputs,{activation:""},t))}}}),sl,ol,ul,ll,dl,Jp=E(()=>{V(),L(),re(),W(),sl=(e,t)=>{if(e.length<3||e.length>4)throw new Error("MatMulNBits requires 3 or 4 inputs");let i=e[0],r=i.dims.length;if(i.dims[r-1]!==t.k)throw new Error("The last dim of input shape does not match the k value");let a=Math.floor((t.k+t.blockSize-1)/t.blockSize),n=t.blockSize/8*t.bits,s=e[1];if(!k.areEqual(s.dims,[t.n,a,n]))throw new Error("The second inputs must be 3D tensor with shape N X nBlocksPerCol X blobSize");let o=e[2].dims;if(k.size(o)!==t.n*a)throw new Error("scales input size error.");if(e.length===4){let u=e[3].dims,l=t.bits>4?t.n*a:t.n*Math.floor((a+1)/2);if(k.size(u)!==l)throw new Error("zeroPoints input size error.")}},ol=(e,t)=>{let i=e[0].dims,r=i.length,a=i[r-2],n=t.k,s=t.n,o=i.slice(0,r-2),u=k.size(o),l=e[1].dims[2]/4,d=e[0].dataType,p=ie(t.k),h=ie(l),c=ie(s),f=o.concat([a,s]),m=a>1&&s/c%2===0?2:1,y=k.size(f)/c/m,_=64,g=[],w=[u,a,n/p],$=k.convertShape(e[1].dims).slice();$.splice(-1,1,l/h),g.push(...M(w)),g.push(...M($)),g.push(...M(e[2].dims)),e.length===4&&g.push(...M(k.convertShape(e[3].dims)));let b=[u,a,s/c];g.push(...M(b));let x=v=>{let I=w.length,T=S("a",e[0].dataType,I,p),C=S("b",12,$.length,h),q=S("scales",e[2].dataType,e[2].dims.length),D=[T,C,q],P=e.length===4?S("zero_points",12,e[3].dims.length):void 0;P&&D.push(P);let Z=b.length,H=O("output",e[0].dataType,Z,c),U=ae(e[0].dataType),A=(()=>{switch(p){case 1:return`array<${U}, 8>`;case 2:return`mat4x2<${U}>`;case 4:return`mat2x4<${U}>`;default:throw new Error(`${p}-component is not supported.`)}})(),J=()=>{let z=`
          // reuse a data
            var input_offset = ${T.indicesToOffset(`${T.type.indices}(batch, row, word_offset)`)};
            var a_data: ${A};
            for (var j: u32 = 0; j < ${8/p}; j++) {
              a_data[j] = ${T.getByOffset("input_offset")};
              input_offset++;
            }
          `;for(let B=0;B<c*m;B++)z+=`
            b_value = ${h===1?`b${B}_data`:`b${B}_data[i]`};
            b_value_lower = unpack4xU8(b_value & b_mask);
            b_value_upper = unpack4xU8((b_value >> 4) & b_mask);
            b_quantized_values = ${A}(${Array.from({length:4},(N,X)=>`${U}(b_value_lower[${X}]), ${U}(b_value_upper[${X}])`).join(", ")});
            b_dequantized_values = ${p===1?`${A}(${Array.from({length:8},(N,X)=>`(b_quantized_values[${X}] - ${P?`zero_point${B}`:"zero_point"}) * scale${B}`).join(", ")});`:`(b_quantized_values - ${A}(${Array(8).fill(`${P?`zero_point${B}`:"zero_point"}`).join(",")})) * scale${B};`};
            workgroup_shared[local_id.x * ${m} + ${Math.floor(B/c)}]${c>1?`[${B%c}]`:""} += ${Array.from({length:8/p},(N,X)=>`${p===1?`a_data[${X}] * b_dequantized_values[${X}]`:`dot(a_data[${X}], b_dequantized_values[${X}])`}`).join(" + ")};
          `;return z},G=()=>{let z=`
            var col_index = col * ${c};
            ${P?`
            let zero_point_bytes_per_col = (nBlocksPerCol + 1) / 2;
            var zero_point_byte_count: u32;
            var zero_point_word_index: u32;
            var zero_point_byte_offset: u32;
            let zero_point_nibble_offset: u32 = block & 0x1u;
            var zero_point_bits_offset: u32;
            var zero_point_word: u32;`:`
            // The default zero point is 8 for unsigned 4-bit quantization.
            let zero_point = ${U}(8);`}
            `;for(let B=0;B<c*m;B++)z+=`
            let scale${B} = ${q.getByOffset("col_index * nBlocksPerCol + block")};
            ${P?`
            zero_point_byte_count = col_index * zero_point_bytes_per_col + (block >> 0x1u);
            zero_point_word_index = zero_point_byte_count >> 0x2u;
            zero_point_byte_offset = zero_point_byte_count & 0x3u;
            zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_nibble_offset << 2);
            zero_point_word = ${P.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point${B} = ${U}((zero_point_word) & 0xFu);`:""}
            col_index += 1;`;return z},j=()=>{let z=`col_index = col * ${c};`;for(let B=0;B<c*m;B++)z+=`
            let b${B}_data = ${C.getByIndices(`${C.type.indices}(col_index, block, word)`)};
            col_index += 1;`;return z+=`
            var b_value: u32;
            let b_mask: u32 = 0x0F0F0F0Fu;
            var b_value_lower: vec4<u32>;
            var b_value_upper: vec4<u32>;
            var b_quantized_values: ${A};
            var b_dequantized_values: ${A};`,z};return`
        var<workgroup> workgroup_shared: array<${H.type.value}, ${m*_}>;
        ${v.declareVariables(...D,H)}
        ${v.mainStart([_,1,1])}
          let output_indices = ${H.offsetToIndices(`(global_idx / ${_}) * ${m}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let nBlocksPerCol = uniforms.b_shape[1];

          for (var block = local_id.x; block < nBlocksPerCol; block += ${_}) {
            //process one block
            var word_offset: u32 = block * ${t.blockSize/p};
            ${G()}
            for (var word: u32 = 0; word < ${l}; word += ${h}) {
              ${j()}
              for (var i: u32 = 0; i < ${h}; i++) {
                ${J()}
                word_offset += ${8/p};
              }
            }
          }
          workgroupBarrier();

          if (local_id.x < ${m}) {
            var output_value: ${H.type.value} = ${H.type.value}(0);
            var workgroup_shared_offset: u32 = local_id.x;
            for (var b: u32 = 0u; b < ${_}u; b++) {
              output_value += workgroup_shared[workgroup_shared_offset];
              workgroup_shared_offset += ${m};
            }
            ${H.setByIndices(`${H.type.indices}(batch, row, col + local_id.x)`,"output_value")};
          }
        }`};return{name:"MatMulNBits",shaderCache:{hint:`${t.blockSize};${t.bits};${p};${h};${c};${m};${_}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:f,dataType:d}],dispatchGroup:{x:y},programUniforms:g}),getShaderSource:x}},ul=(e,t)=>{let i=e[0].dims,r=i.length,a=i[r-2],n=t.k,s=t.n,o=i.slice(0,r-2),u=k.size(o),l=e[1].dims[2]/4,d=e[0].dataType,p=ie(t.k),h=ie(l),c=o.concat([a,s]),f=128,m=s%8===0?8:s%4===0?4:1,y=f/m,_=y*h*8,g=_/p,w=_/t.blockSize,$=k.size(c)/m,b=[],x=[u,a,n/p],v=k.convertShape(e[1].dims).slice();v.splice(-1,1,l/h),b.push(...M(x)),b.push(...M(v)),b.push(...M(e[2].dims)),e.length===4&&b.push(...M(k.convertShape(e[3].dims)));let I=[u,a,s];b.push(...M(I));let T=C=>{let q=x.length,D=S("a",e[0].dataType,q,p),P=S("b",12,v.length,h),Z=S("scales",e[2].dataType,e[2].dims.length),H=[D,P,Z],U=e.length===4?S("zero_points",12,e[3].dims.length):void 0;U&&H.push(U);let A=I.length,J=O("output",e[0].dataType,A),G=ae(e[0].dataType),j=()=>{switch(p){case 1:return`
          let a_data0 = vec4<${G}>(sub_a[word_offset], sub_a[word_offset + 1], sub_a[word_offset + 2], sub_a[word_offset + 3]);
          let a_data1 = vec4<${G}>(sub_a[word_offset + 4], sub_a[word_offset + 5], sub_a[word_offset + 6], sub_a[word_offset + 7]);`;case 2:return`
          let a_data0 = vec4<${G}>(sub_a[word_offset], sub_a[word_offset + 1]);
          let a_data1 = vec4<${G}>(sub_a[word_offset + 2], sub_a[word_offset + 3]);`;case 4:return`
          let a_data0 = sub_a[word_offset];
          let a_data1 = sub_a[word_offset + 1];`;default:throw new Error(`${p}-component is not supported.`)}};return`
        var<workgroup> sub_a: array<${D.type.value}, ${g}>;
        var<workgroup> inter_results: array<array<${J.type.value}, ${y}>, ${m}>;
        ${C.declareVariables(...H,J)}
        ${C.mainStart([y,m,1])}
          let output_indices = ${J.offsetToIndices(`workgroup_index * ${m}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let n_blocks_per_col = uniforms.b_shape[1];
          let num_tiles =  (n_blocks_per_col - 1) / ${w} + 1;

          // Loop over shared dimension.
          for (var tile: u32 = 0; tile < num_tiles; tile += 1) {
            let a_col_start = tile * ${g};
            // load one tile A data into shared memory.
            for (var a_offset = local_idx; a_offset < ${g}; a_offset += ${f})
            {
              let a_col = a_col_start + a_offset;
              if (a_col < uniforms.a_shape[2])
              {
                sub_a[a_offset] = ${D.getByIndices(`${D.type.indices}(batch, row, a_col)`)};
              } else {
                sub_a[a_offset] = ${D.type.value}(0);
              }
            }
            workgroupBarrier();

            // each thread process one block
            let b_row = col + local_id.y;
            let block = tile * ${w} + local_id.x;
            ${U?`
            let zero_point_bytes_per_col = (n_blocks_per_col + 1) / 2;
            let zero_point_byte_count = b_row * zero_point_bytes_per_col + (block >> 0x1u);
            let zero_point_word_index = zero_point_byte_count >> 0x2u;
            let zero_point_byte_offset = zero_point_byte_count & 0x3u;
            let zero_point_nibble_offset: u32 = block & 0x1u;
            let zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_nibble_offset << 2);
            let zero_point_word = ${U.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point = ${G}((zero_point_word) & 0xFu);`:`
            // The default zero point is 8 for unsigned 4-bit quantization.
            let zero_point = ${G}(8);`}
            let scale = ${Z.getByOffset("b_row * n_blocks_per_col + block")};
            let b_data = ${P.getByIndices(`${P.type.indices}(b_row, block, 0)`)};
            var word_offset = local_id.x * ${t.blockSize/p};
            for (var i: u32 = 0; i < ${h}; i++) {
              ${j()}
              let b_value = ${h===1?"b_data":"b_data[i]"};
              let b_value_lower = unpack4xU8(b_value & 0x0F0F0F0Fu);
              let b_value_upper = unpack4xU8((b_value >> 4) & 0x0F0F0F0Fu);
              let b_quantized_values = mat2x4<${G}>(${Array.from({length:4},(z,B)=>`${G}(b_value_lower[${B}]), ${G}(b_value_upper[${B}])`).join(", ")});
              let b_dequantized_values = (b_quantized_values - mat2x4<${G}>(${Array(8).fill("zero_point").join(",")})) * scale;
              inter_results[local_id.y][local_id.x] += ${Array.from({length:2},(z,B)=>`${`dot(a_data${B}, b_dequantized_values[${B}])`}`).join(" + ")};
              word_offset += ${8/p};
            }
            workgroupBarrier();
          }

          if (local_idx < ${m}) {
            var output_value: ${J.type.value} = ${J.type.value}(0);
            for (var b = 0u; b < ${y}; b++) {
              output_value += inter_results[local_idx][b];
            }
            if (col + local_idx < uniforms.output_shape[2])
            {
              ${J.setByIndices(`${J.type.indices}(batch, row, col + local_idx)`,"output_value")}
            }
          }
        }`};return{name:"BlockwiseMatMulNBits32",shaderCache:{hint:`${t.blockSize};${p};${h};${y};${m}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:c,dataType:d}],dispatchGroup:{x:$},programUniforms:b}),getShaderSource:T}},ll=(e,t)=>{sl(e.inputs,t),t.blockSize===32&&e.adapterInfo.isVendor("intel")&&e.adapterInfo.isArchitecture("gen-12lp")?e.compute(ul(e.inputs,t)):e.compute(ol(e.inputs,t))},dl=e=>Q(e)}),pl,hl,cl,fl,ml,gl,_l,yl,$l,eh=E(()=>{V(),L(),W(),pl=e=>{if(!e||e.length<1)throw new Error("Too few inputs");if(e[0].dataType!==1&&e[0].dataType!==10)throw new Error("Input type must be float or float16.");if(e.length>=2){let t=e[0].dims.length*2===e[1].dims[0];if(e.length===4&&(t=e[3].dims[0]*2===e[1].dims[0]),!t)throw new Error("The pads should be a 1D tensor of shape [2 * input_rank] or [2 * num_axes].")}},hl=(e,t,i)=>{let r="";for(let a=t-1;a>=0;--a)r+=`
            k = i32(${e.indicesGet("indices",a)}) - ${R("uniforms.pads",a,i)};
            if (k < 0) {
              break;
            }
            if (k >= i32(${R("uniforms.x_shape",a,t)})) {
              break;
            }
            offset += k * i32(${R("uniforms.x_strides",a,t)});
        `;return`
          value = ${e.type.value}(uniforms.constant_value);
          for (var i = 0; i < 1; i++) {
            var offset = 0;
            var k = 0;
            ${r}
            value = x[offset];
          }
      `},cl=(e,t,i)=>{let r="";for(let a=t-1;a>=0;--a)r+=`
                k = i32(${e.indicesGet("indices",a)}) - ${R("uniforms.pads",a,i)};
                if (k < 0) {
                  k = -k;
                }
                {
                  let _2n_1 = 2 * (i32(${R("uniforms.x_shape",a,t)}) - 1);
                  k = k % _2n_1;
                  if(k >= i32(${R("uniforms.x_shape",a,t)})) {
                    k = _2n_1 - k;
                  }
                }
                offset += k * i32(${R("uniforms.x_strides",a,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${r}
              value = x[offset];
          `},fl=(e,t,i)=>{let r="";for(let a=t-1;a>=0;--a)r+=`
                k = i32(${e.indicesGet("indices",a)}) - ${R("uniforms.pads",a,i)};
                if (k < 0) {
                  k = 0;
                }
                if (k >= i32(${R("uniforms.x_shape",a,t)})) {
                  k = i32(${R("uniforms.x_shape",a,t)}) - 1;
                }
                offset += k * i32(${R("uniforms.x_strides",a,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${r}
              value = x[offset];
          `},ml=(e,t,i)=>{let r="";for(let a=t-1;a>=0;--a)r+=`
                k = i32(${e.indicesGet("indices",a)}) - ${R("uniforms.pads",a,i)};
                if (k < 0)  {
                  k += i32(${R("uniforms.x_shape",a,t)}]);
                }
                if (k >= i32(${R("uniforms.x_shape",a,t)})) {
                  k -= i32(${R("uniforms.x_shape",a,t)});
                }
                offset += k * i32(${R("uniforms.x_strides",a,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${r}
              value = x[offset];
          `},gl=(e,t,i)=>{switch(i.mode){case 0:return hl(e,t,i.pads.length);case 1:return cl(e,t,i.pads.length);case 2:return fl(e,t,i.pads.length);case 3:return ml(e,t,i.pads.length);default:throw new Error("Invalid mode")}},_l=(e,t)=>{let i=k.padShape(e[0].dims.slice(),t.pads),r=e[0].dims,a=k.size(i),n=[{type:12,data:a},{type:6,data:t.pads}],s=e.length>=3&&e[2].data;t.mode===0&&n.push({type:s?e[2].dataType:1,data:t.value}),n.push(...M(e[0].dims,i));let o=["rank"],u=l=>{let d=O("output",e[0].dataType,i.length),p=S("x",e[0].dataType,r.length),h=p.type.value,c=gl(d,r.length,t),f=[{name:"output_size",type:"u32"},{name:"pads",type:"i32",length:t.pads.length}];return t.mode===0&&f.push({name:"constant_value",type:s?h:"f32"}),`
            ${l.registerUniforms(f).declareVariables(p,d)}
            ${l.mainStart()}
            ${l.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

            let indices = ${d.offsetToIndices("global_idx")};

            var value = ${h}(0);
            ${c}
            output[global_idx] = value;
        }`};return{name:"Pad",shaderCache:{hint:`${t.mode}${s}`,inputDependencies:o},getRunData:()=>({outputs:[{dims:i,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(k.size(i)/64)},programUniforms:n}),getShaderSource:u}},yl=(e,t)=>{if(e.length>1){let i=e[1].getBigInt64Array(),r=e.length>=3&&e[2].data?e[2].dataType===10?e[2].getUint16Array()[0]:e[2].getFloat32Array()[0]:0,a=e[0].dims.length,n=new Int32Array(2*a).fill(0);if(e.length>=4){let o=e[3].getBigInt64Array();for(let u=0;u<o.length;u++)n[Number(o[u])]=Number(i[u]),n[Number(o[u])+a]=Number(i[u+o.length])}else i.forEach((o,u)=>n[Number(u)]=Number(o));let s=[];return n.forEach(o=>s.push(o)),{mode:t.mode,value:r,pads:s}}else return t},$l=(e,t)=>{pl(e.inputs);let i=yl(e.inputs,t);e.compute(_l(e.inputs,i),{inputs:[0]})}}),bt,hr,cr,fr,mr,wl,bl,gr,_r,vl,xl,yr,kl,Il,$r,Sl,Tl,zl,El,th=E(()=>{we(),V(),L(),W(),bt=e=>{if(te.webgpu.validateInputContent&&(!e||e.length!==1))throw new Error("Pool ops requires 1 input.")},hr=(e,t,i)=>{let r=t.format==="NHWC",a=e.dims.slice();r&&a.splice(1,0,a.pop());let n=Object.hasOwnProperty.call(t,"dilations"),s=t.kernelShape.slice(),o=t.strides.slice(),u=n?t.dilations.slice():[],l=t.pads.slice();Bt.adjustPoolAttributes(i,a,s,o,u,l);let d=Bt.computePoolOutputShape(i,a,o,u,s,l,t.autoPad),p=Object.assign({},t);n?Object.assign(p,{kernelShape:s,strides:o,pads:l,dilations:u,cacheKey:t.cacheKey}):Object.assign(p,{kernelShape:s,strides:o,pads:l,cacheKey:t.cacheKey});let h=d.slice();return h.push(h.splice(1,1)[0]),[p,r?h:d]},cr=(e,t)=>{let i=t.format==="NHWC",r=k.size(e),a=k.size(t.kernelShape),n=[{type:12,data:r},{type:12,data:a}],s=[{name:"outputSize",type:"u32"},{name:"kernelSize",type:"u32"}];if(t.kernelShape.length<=2){let o=t.kernelShape[t.kernelShape.length-1],u=t.strides[t.strides.length-1],l=t.pads[t.pads.length/2-1],d=t.pads[t.pads.length-1],p=!!(l+d);n.push({type:12,data:o},{type:12,data:u},{type:12,data:l},{type:12,data:d}),s.push({name:"kw",type:"u32"},{name:"sw",type:"u32"},{name:"pwStart",type:"u32"},{name:"pwEnd",type:"u32"});let h=!1;if(t.kernelShape.length===2){let c=t.kernelShape[t.kernelShape.length-2],f=t.strides[t.strides.length-2],m=t.pads[t.pads.length/2-2],y=t.pads[t.pads.length-2];h=!!(m+y),n.push({type:12,data:c},{type:12,data:f},{type:12,data:m},{type:12,data:y}),s.push({name:"kh",type:"u32"},{name:"sh",type:"u32"},{name:"phStart",type:"u32"},{name:"phEnd",type:"u32"})}return[n,s,!0,p,h]}else{if(i)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let o=k.computeStrides(t.kernelShape);n.push({type:12,data:o},{type:12,data:t.pads},{type:12,data:t.strides}),s.push({name:"kernelStrides",type:"u32",length:o.length},{name:"pads",type:"u32",length:t.pads.length},{name:"strides",type:"u32",length:t.strides.length});let u=t.pads.reduce((l,d)=>l+d);return[n,s,!!u,!1,!1]}},fr=(e,t,i,r,a,n,s,o,u,l,d,p)=>{let h=a.format==="NHWC",c=t.type.value,f=O("output",t.type.tensor,r);if(a.kernelShape.length<=2){let m="",y="",_="",g=i-(h?2:1);if(d?m=`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${g}] = indices[${g}] * uniforms.sw - uniforms.pwStart + i;
                  if (xIndices[${g}] < 0 || xIndices[${g}]
                      >= uniforms.x_shape[${g}]) {
                    pad++;
                    continue;
                  }
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${n}
                }`:m=`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${g}] = indices[${g}] * uniforms.sw - uniforms.pwStart + i;
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${n}
                }`,a.kernelShape.length===2){let w=i-(h?3:2);p?y=`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${w}] = indices[${w}] * uniforms.sh - uniforms.phStart + j;
                  if (xIndices[${w}] < 0 || xIndices[${w}] >= uniforms.x_shape[${w}]) {
                    pad += i32(uniforms.kw);
                    continue;
                  }
              `:y=`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${w}] = indices[${w}] * uniforms.sh - uniforms.phStart + j;
                `,_=`
              }
            `}return`
            ${e.registerUniforms(u).declareVariables(t,f)}

            ${e.mainStart()}
              ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

              let indices = ${f.offsetToIndices("global_idx")};
              var xIndices = ${f.offsetToIndices("global_idx")};

              var value = ${c}(${o});
              var pad = 0;
              ${y}
              ${m}
              ${_}
              ${s}

              output[global_idx] = value;
            }`}else{if(h)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let m=a.kernelShape.length,y=a.pads.length,_="";return l?_=`
                if (xIndices[j] >= uniforms.x_shape[j]) {
                  pad++;
                  isPad = true;
                  break;
                }
              }
              if (!isPad) {
                let x_val = x[${t.indicesToOffset("xIndices")}];
                ${n}
              }`:_=`
              }
              let x_val = x[${t.indicesToOffset("xIndices")}];
              ${n}
            `,`
            ${e.registerUniforms(u).declareVariables(t,f)}

            ${e.mainStart()}
              ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
              let indices = ${f.offsetToIndices("global_idx")};
              var xIndices = ${f.offsetToIndices("global_idx")};

              var offsets: array<u32, ${m}>;

              var value = ${c}(${o});
              var pad = 0;
              var isPad = false;

              for (var i: u32 = 0u; i < uniforms.kernelSize; i++) {
                var offset = i;
                for (var j = 0u; j < ${m-1}u; j++) {
                  offsets[j] = offset / ${R("uniforms.kernelStrides","j",m)};
                  offset -= offsets[j] * ${R("uniforms.kernelStrides","j",m)};
                }
                offsets[${m-1}] = offset;

                isPad = false;
                for (var j = ${i-m}u; j < ${i}u; j++) {
                  xIndices[j] = indices[j] * ${R("uniforms.strides",`j - ${i-m}u`,m)}
                    + offsets[j - ${i-m}u] - ${R("uniforms.pads","j - 2u",y)};
                  ${_}
              }
              ${s}

              output[global_idx] = value;
            }`}},mr=e=>`${e.format};${e.ceilMode};${e.autoPad};${e.kernelShape.length}`,wl=e=>`${mr(e)};${e.countIncludePad}`,bl=e=>`${mr(e)};${e.storageOrder};${e.dilations}`,gr=e=>({format:e.format,autoPad:["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],ceilMode:e.ceil_mode,kernelShape:e.kernel_shape,strides:e.strides,pads:e.pads}),_r=(e,t,i,r)=>{let[a,n]=hr(t,r,i),s=S("x",t.dataType,t.dims.length),o=s.type.value,u="value += x_val;",l="";a.countIncludePad?l+=`value /= ${o}(uniforms.kernelSize);`:l+=`value /= ${o}(i32(uniforms.kernelSize) - pad);`;let[d,p,h,c,f]=cr(n,a);d.push(...M(t.dims,n));let m=["rank"];return{name:e,shaderCache:{hint:`${r.cacheKey};${h};${c};${f}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:n,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(k.size(n)/64)},programUniforms:d}),getShaderSource:y=>fr(y,s,t.dims.length,n.length,a,u,l,0,p,h,c,f)}},vl=e=>{let t=e.count_include_pad!==0,i=gr(e);if(i.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for AveragePool");let r={countIncludePad:t,...i,cacheKey:""};return{...r,cacheKey:wl(r)}},xl=(e,t)=>{bt(e.inputs),e.compute(_r("AveragePool",e.inputs[0],!1,t))},yr={autoPad:"",ceilMode:0,countIncludePad:!1,kernelShape:[],strides:[],pads:[],storageOrder:0,dilations:[]},kl=e=>{let t=e.format;return{format:t,...yr,cacheKey:t}},Il=(e,t)=>{bt(e.inputs),e.compute(_r("GlobalAveragePool",e.inputs[0],!0,t))},$r=(e,t,i,r)=>{let[a,n]=hr(t,r,i),s=`
      value = max(x_val, value);
    `,o="",u=S("x",t.dataType,t.dims.length),l=["rank"],[d,p,h,c,f]=cr(n,a);return d.push(...M(t.dims,n)),{name:e,shaderCache:{hint:`${r.cacheKey};${h};${c};${f}`,inputDependencies:l},getRunData:()=>({outputs:[{dims:n,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(k.size(n)/64)},programUniforms:d}),getShaderSource:m=>fr(m,u,t.dims.length,n.length,a,s,o,t.dataType===10?-65504:-1e5,p,h,c,f)}},Sl=(e,t)=>{bt(e.inputs),e.compute($r("MaxPool",e.inputs[0],!1,t))},Tl=e=>{let t=e.storage_order,i=e.dilations,r=gr(e);if(t!==0)throw new Error("column major storage order is not yet supported for MaxPool");if(r.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for MaxPool");let a={storageOrder:t,dilations:i,...r,cacheKey:""};return{...a,cacheKey:bl(a)}},zl=e=>{let t=e.format;return{format:t,...yr,cacheKey:t}},El=(e,t)=>{bt(e.inputs),e.compute($r("GlobalMaxPool",e.inputs[0],!0,t))}}),Cl,Bl,Al,Ol,ih=E(()=>{V(),L(),re(),W(),Cl=(e,t)=>{if(e.length<2||e.length>3)throw new Error("DequantizeLinear requires 2 or 3 inputs.");if(e.length===3&&e[1].dims===e[2].dims)throw new Error("x-scale and x-zero-point must have the same shape.");if(e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[0].dataType===6&&e.length>2)throw new Error("In the case of dequantizing int32 there is no zero point.");if(e[1].dims.length!==0&&e[1].dims.length!==1&&e[1].dims.length!==e[0].dims.length)throw new Error("scale input must be a scalar, a 1D tensor, or have the same rank as the input tensor.");if(e.length>2){if(e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[1].dims.length!==e[2].dims.length)throw new Error("scale and zero-point inputs must have the same rank.");if(!e[1].dims.map((i,r)=>i===e[2].dims[r]).reduce((i,r)=>i&&r,!0))throw new Error("scale and zero-point inputs must have the same shape.")}if(t.blockSize>0){if(e[1].dims.length===0||e[1].dims.length===1&&e[1].dims[0]===1)throw new Error("blockSize must be set only for block quantization.");if(!e[1].dims.map((a,n)=>n===t.axis||a===e[0].dims[n]).reduce((a,n)=>a&&n,!0))throw new Error("For block qunatization, scale input shape to match the input shape except for the axis");if(e[1].dims.length!==e[0].dims.length)throw new Error("For block qunatization the scale input rank must be the same as the x rank.");let i=e[0].dims[t.axis],r=e[1].dims[t.axis];if(t.blockSize<Math.ceil(i/r)||t.blockSize>Math.ceil(i/(r-1)-1))throw new Error("blockSize must be with in the range [ceil(dI / Si), ceil(dI / (Si - 1) - 1)].")}},Bl=(e,t)=>{let i=k.normalizeAxis(t.axis,e[0].dims.length),r=e[0].dataType,a=r===3,n=e[0].dims,s=e[1].dataType,o=k.size(n),u=r===3||r===2,l=u?[Math.ceil(k.size(e[0].dims)/4)]:e[0].dims,d=e[1].dims,p=e.length>2?e[2]:void 0,h=p?u?[Math.ceil(k.size(p.dims)/4)]:p.dims:void 0,c=d.length===0||d.length===1&&d[0]===1,f=c===!1&&d.length===1,m=ie(o),y=c&&(!u||m===4),_=y?m:1,g=y&&!u?m:1,w=S("input",u?12:r,l.length,g),$=S("scale",s,d.length),b=p?S("zero_point",u?12:r,h.length):void 0,x=O("output",s,n.length,_),v=[w,$];b&&v.push(b);let I=[l,d];p&&I.push(h);let T=[{type:12,data:o/_},{type:12,data:i},{type:12,data:t.blockSize},...M(...I,n)],C=q=>{let D=[{name:"output_size",type:"u32"},{name:"axis",type:"u32"},{name:"block_size",type:"u32"}];return`
      ${q.registerUniforms(D).declareVariables(...v,x)}
      ${q.mainStart()}
          ${q.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let output_indices = ${x.offsetToIndices("global_idx")};

          // Set input x
          ${u?`
            let input = ${w.getByOffset("global_idx / 4")};
            let x_vec = ${a?"unpack4xI8(input)":"unpack4xU8(input)"};
            let x_value = ${_===1?"x_vec[global_idx % 4]":"x_vec"};`:`let x_value = ${w.getByOffset("global_idx")};`};

          // Set scale input
          ${c?`let scale_value= ${$.getByOffset("0")}`:f?`
            let scale_index = ${x.indicesGet("output_indices","uniforms.axis")};
            let scale_value= ${$.getByOffset("scale_index")};`:`
            var scale_indices: ${$.type.indices} = output_indices;
            let index = ${$.indicesGet("scale_indices","uniforms.axis")} / uniforms.block_size;
            ${$.indicesSet("scale_indices","uniforms.axis","index")};
            let scale_value= ${$.getByIndices("scale_indices")};`};

          // Set zero-point input
          ${b?c?u?`
                let zero_point_input = ${b.getByOffset("0")};
                let zero_point_vec =  ${a?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value= zero_point_vec[0]`:`let zero_point_value = ${b.getByOffset("0")}`:f?u?`
                let zero_point_index = ${x.indicesGet("output_indices","uniforms.axis")};
                let zero_point_input = ${b.getByOffset("zero_point_index / 4")};
                let zero_point_vec =  ${a?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_index % 4]`:`
                let zero_point_index = ${x.indicesGet("output_indices","uniforms.axis")};
                let zero_point_value = ${b.getByOffset("zero_point_index")};`:u?`
                let zero_point_offset = ${$.indicesToOffset("scale_indices")};
                let zero_point_input = ${b.getByOffset("zero_point_offset / 4")};
                let zero_point_vec = ${a?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_offset % 4];`:`let zero_point_value = ${b.getByIndices("scale_indices")};`:`let zero_point_value = ${u?a?"i32":"u32":w.type.value}(0);`};
      // Compute and write output
      ${x.setByOffset("global_idx",`${x.type.value}(x_value - zero_point_value) * scale_value`)};
      }`};return{name:"DequantizeLinear",shaderCache:{hint:t.cacheKey,inputDependencies:b?["rank","rank","rank"]:["rank","rank"]},getShaderSource:C,getRunData:()=>({outputs:[{dims:n,dataType:s}],dispatchGroup:{x:Math.ceil(o/_/64),y:1,z:1},programUniforms:T})}},Al=(e,t)=>{Cl(e.inputs,t),e.compute(Bl(e.inputs,t))},Ol=e=>Q({axis:e.axis,blockSize:e.blockSize})}),Rl,Dl,Ml,rh=E(()=>{we(),V(),W(),Rl=(e,t,i)=>{let r=e===t,a=e<t&&i<0,n=e>t&&i>0;if(r||a||n)throw new Error("Range these inputs' contents are invalid.")},Dl=(e,t,i,r)=>{let a=Math.abs(Math.ceil((t-e)/i)),n=[a],s=a,o=[{type:12,data:s},{type:r,data:e},{type:r,data:i},...M(n)],u=l=>{let d=O("output",r,n.length),p=d.type.value,h=[{name:"outputSize",type:"u32"},{name:"start",type:p},{name:"delta",type:p}];return`
        ${l.registerUniforms(h).declareVariables(d)}
        ${l.mainStart()}
        ${l.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        output[global_idx] = uniforms.start + ${p}(global_idx) * uniforms.delta;
      }`};return{name:"Range",shaderCache:{hint:`${r}`},getShaderSource:u,getRunData:()=>({outputs:[{dims:n,dataType:r}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:o})}},Ml=e=>{let t=0,i=0,r=0;e.inputs[0].dataType===6?(t=e.inputs[0].getInt32Array()[0],i=e.inputs[1].getInt32Array()[0],r=e.inputs[2].getInt32Array()[0]):e.inputs[0].dataType===1&&(t=e.inputs[0].getFloat32Array()[0],i=e.inputs[1].getFloat32Array()[0],r=e.inputs[2].getFloat32Array()[0]),te.webgpu.validateInputContent&&Rl(t,i,r),e.compute(Dl(t,i,r,e.inputs[0].dataType),{inputs:[]})}}),Pl,wr,br,Ul,ql,Nl,ah=E(()=>{V(),L(),re(),W(),Pl=(e,t,i,r)=>{if(e!=="none"&&r!=="i32"&&r!=="u32"&&r!=="f32")throw new Error(`Input ${r} is not supported with reduction ${e}.`);let a=`{
                var oldValue = 0;
                loop {
                  let newValueF32 =`,n=`;
                  let newValue = bitcast<i32>(newValueF32);
                  let res = atomicCompareExchangeWeak(&${t}, oldValue, newValue);
                  if res.exchanged {
                    break;
                  }
                  oldValue = res.old_value;
                }
              }`;switch(e){case"none":return`${t}=${i};`;case"add":return r==="i32"||r==="u32"?`atomicAdd(&${t}, bitcast<${r}>(${i}));`:`
              ${a}bitcast<${r}>(oldValue) + (${i})${n}`;case"max":return r==="i32"||r==="u32"?`atomicMax(&${t}, bitcast<${r}>(${i}));`:`
                ${a}max(bitcast<f32>(oldValue), (${i}))${n}`;case"min":return r==="i32"||r==="u32"?`atomicMin(&${t}, bitcast<${r}>(${i}));`:`${a}min(bitcast<${r}>(oldValue), (${i}))${n}`;case"mul":return`${a}(bitcast<${r}>(oldValue) * (${i}))${n}`;default:throw new Error(`Reduction ${e} is not supported.`)}},wr=(e,t)=>`${e===1?`
    let element_count_dim = uniforms.output_strides;
    let dim_value = uniforms.output_shape;`:`
    let element_count_dim = uniforms.output_strides[${t?"i - indices_start":"i"}];
    let dim_value = uniforms.output_shape[${t?"i - indices_start":"i"} + uniforms.last_index_dimension];`}
    
    if (index >= 0) {
      if (index >= i32(dim_value)) {
        index = i32(dim_value - 1);
      }
    } else {
      if (index < -i32(dim_value)) {
        index = 0;
      } else {
        index += i32(dim_value);
      }
    }
    data_offset += u32((u32(index) * element_count_dim));`,br=(e,t,i)=>`for (var i = 0u; i < uniforms.num_updates_elements; i++) {
        let value = updates[uniforms.num_updates_elements * ${i?"global_idx":"idx"} + i];
        ${Pl(e.reduction,"output[data_offset + i]","value",t)}
      }`,Ul=(e,t)=>{let i=e[0].dims,r=e[1].dims,a=i,n=1,s=Math.ceil(k.size(r)/n),o=r[r.length-1],u=k.sizeFromDimension(i,o),l=k.sizeFromDimension(r,0)/o,d=[{type:12,data:s},{type:12,data:o},{type:12,data:u},...M(e[1].dims,e[2].dims,a)],p=h=>{let c=S("indices",e[1].dataType,e[1].dims.length),f=S("updates",e[2].dataType,e[2].dims.length,n),m=t.reduction!=="none"&&t.reduction!==""?Ga("output",e[0].dataType,a.length):O("output",e[0].dataType,a.length,n);return`
      ${h.registerUniform("output_size","u32").registerUniform("last_index_dimension","u32").registerUniform("num_updates_elements","u32").declareVariables(c,f,m)}
      ${h.mainStart()}
        ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
  var hasDuplicates = false;
  if (${t.reduction==="none"}) {
    for (var i = 0; i < ${l}; i = i + 1) {
      for (var j = i + 1; j < ${l}; j = j + 1) {
        var index_i = i32(indices[i].x);
        var index_j = i32(indices[j].x);
        if (index_i == index_j) {
          hasDuplicates = true;
          break;
        }
      }
      if (hasDuplicates) {
        break;
      }
    }
  }

  if (${t.reduction==="none"} && hasDuplicates) {
    if (global_idx != 0u) {
      return;
    }
    // Process each index-update pair individually when duplicates exist
    for (var idx = 0u; idx < ${l}u; idx++) {
      var data_offset = 0u;
      for (var i = 0u; i < uniforms.last_index_dimension; i++) {
        var index = i32(indices[idx * uniforms.last_index_dimension + i].x);
        ${wr(i.length,!1)}
      }
      ${br(t,m.type.value,!1)}
    }
    return;
  }

  var data_offset = 0u;
  var indices_start = uniforms.last_index_dimension * global_idx;
  var indices_end = indices_start + uniforms.last_index_dimension;
  for (var i = indices_start; i < indices_end; i++) {
    var index = i32(indices[i].x);
    ${wr(i.length,!0)}
  }
  ${br(t,m.type.value,!0)}
  }`};return{name:"ScatterND",shaderCache:{hint:`${t.cacheKey}_${t.reduction}`,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:a,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:d}),getShaderSource:p}},ql=e=>Q({reduction:e.reduction}),Nl=(e,t)=>{e.compute(Ul(e.inputs,t),{inputs:[e.inputs[1],e.inputs[2]],outputs:[]})}}),Vl,Ll,Wl,vr,Gl,Hl,Fl,jl,Kl,Zl,Ql,Xl,xr,Yl,Jl,ed,td,id,rd,ad,nh=E(()=>{V(),L(),re(),W(),Vl=(e,t)=>{if(e.every(i=>i>0||(()=>{throw new Error("Resize requires scales input values to be positive")})),e.length>0){if(t.mode==="linear"){if(!(e.length===2||e.length===3||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1||e.length===5&&e[0]===1&&e[1]===1))throw new Error(`For linear mode, Resize requires scales to be 2D, 3D, 4D with either two outermost or one innermost and
            one outermost scale values equal to 1, or 5D with two outermost scale values equal to 1`)}else if(t.mode==="cubic"&&!(e.length===2||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1))throw new Error("Resize requires scales input size to be 2 or 4 for cubic mode")}},Ll=(e,t,i)=>{t.every(a=>a>=0&&a<i||(()=>{throw new Error("Resize requires axes input values to be positive and less than rank")}));let r=new Array(i).fill(1);return t.forEach((a,n)=>r[a]=e[n]),r},Wl=(e,t,i,r,a,n)=>{let[s,o,u]=i>10?[1,2,3]:[-1,e.length>1?1:-1,-1],l=e[0].dims.length;if(s>0&&e.length>s&&e[s].dims.length>0)e[s].getFloat32Array().forEach(d=>n.push(d));else if(t.coordinateTransformMode==="tf_crop_and_resize")throw new Error("Resize requires RoI input to be specified when coordinateTransformMode is tfCropAndResize");if(o>0&&e.length>o&&e[o].dims.length===1&&e[o].dims[0]>0){if(e[o].getFloat32Array().forEach(d=>r.push(d)),r.length!==0&&r.length!==l&&i>=18&&r.length!==t.axes.length)throw new Error("Resize requires scales input size to be same as input rank or axes size for opset 18 and up");Vl(r,t),t.axes.length>0&&Ll(r,t.axes,l).forEach((d,p)=>r[p]=d)}if(u>0&&e.length>u&&e[u].dims.length===1&&e[u].dims[0]>0&&(e[u].getBigInt64Array().forEach(d=>a.push(Number(d))),a.length!==0&&a.length!==l&&i>=18&&a.length!==t.axes.length))throw new Error("Resize requires sizes input size to be same as input rank or axes size for opset 18 and up");if(t.axes.length>0){if(r.length!==0&&r.length!==t.axes.length)throw new Error('Resize requires "scales" input size to be of axes rank when axes attributes is specified');if(a.length!==0&&a.length!==t.axes.length)throw new Error('Resize requires "sizes" input size to be of rank axes rank when axes attributes is specified')}if(typeof r<"u"&&typeof a<"u"&&r.length>0&&a.length>l)throw new Error("Resize requires only of scales or sizes to be specified")},vr=(e,t,i,r)=>`
  // The whole part and the fractional part are calculated separately due to inaccuracy of floating
  // point division. As an example, f32(21) / f32(7) may evaluate to 2.99... instead of 3, causing an
  // offset-by-one error later in floor().
  let big = (${e}) * (${t});
  let whole = ${r}(big / (${i}));
  let fract = ${r}(big % (${i})) / ${r}(${i});
  return whole + fract;
`,Gl=(e,t)=>`fn getOriginalCoordinateFromResizedCoordinate(xResized: u32, xScale: f32, lengthResized: u32,
     lengthOriginal: u32, roiStart: f32, roiEnd: f32) -> ${t} { `+(()=>{switch(e){case"asymmetric":return`
          if (xScale < 1.0 || floor(xScale) != xScale) {
            return ${t}(xResized) / ${t}(xScale);
          } else {
            ${vr("xResized","lengthOriginal","lengthResized",t)}
          }
        `;case"pytorch_half_pixel":return`if (lengthResized > 1) {
                    return (${t}(xResized) + 0.5) / ${t}(xScale) - 0.5;
                  } else {
                    return 0.0;
                  }`;case"tf_half_pixel_for_nn":return`return (${t}(xResized) + 0.5) / ${t}(xScale);`;case"align_corners":return`if (lengthResized == 1) {
                    return 0.0;
                  } else {
                    ${vr("xResized","lengthOriginal - 1","lengthResized - 1",t)}
                  }`;case"tf_crop_and_resize":return`if (lengthResized > 1) {
                    return ${t}(roiStart) * ${t}(lengthOriginal - 1) +
                        (${t}(xResized) * ${t}(roiEnd - roiStart) * ${t}(lengthOriginal - 1)) /
                        ${t}(lengthResized - 1);
                  } else {
                    return 0.5 * ${t}(roiStart + roiEnd) * ${t}(lengthOriginal - 1);
                  }`;case"half_pixel_symmetric":return`const outputWidth = ${t}xScale * ${t}(lengthResized);
                  const adjustment = ${t}(lengthResized) / outputWidth;
                  const center = ${t}(lengthOriginal) / 2;
                  const offset = center * (1 - adjustment);
                  return offset + ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;case"half_pixel":return`return ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;default:throw new Error(`Coordinate transform mode ${e} is not supported`)}})()+"}",Hl=(e,t,i)=>`fn getNearestPixelFromOriginal(xOriginal: ${i}, isDownSample: bool) -> ${i} {`+(()=>{switch(e){case"round_prefer_ceil":return"if (fract(xOriginal) == 0.5) {             return ceil(xOriginal);           } else {             return round(xOriginal);           }";case"floor":return"return floor(xOriginal);";case"ceil":return"return ceil(xOriginal);";case"round_prefer_floor":return"if (fract(xOriginal) == 0.5) {                     return floor(xOriginal);                   } else {                     return round(xOriginal);                   }";case"simple":default:if(t<11)return"if (isDownSample)                     {                       return ceil(xOriginal);                     } else {                       return xOriginal;                     }";throw new Error(`Nearest mode ${e} is not supported`)}})()+"}",Fl=(e,t,i)=>{let r=new Array(i).fill(0).concat(new Array(i).fill(1)),a=e.length===0?r:e.slice();return t.length>0?(t.forEach((n,s)=>{r[n]=a[s],r[s+i]=a[t.length+s]}),r):a},jl=(e,t,i,r)=>{let a=[];if(i.length>0)if(r.length>0){if(e.forEach(n=>a.push(n)),Math.max(...r)>e.length)throw new Error("axes is out of bound");r.forEach((n,s)=>a[n]=i[s])}else i.forEach(n=>a.push(n));else{if(t.length===0)throw new Error("Resize requires either scales or sizes.");a=e.map((n,s)=>Math.round(n*t[s]))}return a},Kl=(e,t,i)=>{let r=(()=>{switch(i.keepAspectRatioPolicy){case"not_larger":return i.axes.length>0?Math.min(...i.axes.map(n=>t[n]),Number.MAX_VALUE):Math.min(...t,Number.MAX_VALUE);case"not_smaller":return i.axes.length>0?Math.max(...i.axes.map(n=>t[n]),Number.MIN_VALUE):Math.max(...t,Number.MIN_VALUE);default:throw new Error(`Keep aspect ratio policy ${i.keepAspectRatioPolicy} is not supported`)}})();t.fill(1,0,t.length);let a=e.slice();return i.axes.length>0?(i.axes.forEach(n=>t[n]=r),i.axes.forEach(n=>a[n]=Math.round(e[n]*t[n]))):(t.fill(r,0,t.length),a.forEach((n,s)=>a[s]=Math.round(n*t[s]))),a},Zl=(e,t,i,r,a)=>`
    fn calculateOriginalIndicesFromOutputIndices(output_indices: ${e.type.indices}) -> array<${e.type.value}, ${i.length}> {
      var original_indices: array<${e.type.value}, ${i.length}>;
      for (var i:u32 = 0; i < ${i.length}; i++) {
        var output_index = ${e.indicesGet("output_indices","i")};
        var scale = ${R("uniforms.scales","i",r)};
        var roi_low = ${R("uniforms.roi","i",a)};
        var roi_hi = ${R("uniforms.roi",`i + ${t.length}`,a)};
        if (scale == 1.0) {
          original_indices[i] = ${e.type.value}(output_index);
        } else {
          var input_shape_i = ${R("uniforms.input_shape","i",t.length)};
          var output_shape_i = ${R("uniforms.output_shape","i",i.length)};
          original_indices[i] = getOriginalCoordinateFromResizedCoordinate(output_index, scale, output_shape_i,
                                                                           input_shape_i, roi_low, roi_hi);
        }
      }
      return original_indices;
    }`,Ql=(e,t,i,r,a,n,s)=>`
    fn calculateInputIndicesFromOutputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
      var input_indices: ${e.type.indices};
      for (var i:u32 = 0; i < ${r.length}; i++) {
        var output_index = ${t.indicesGet("output_indices","i")};
        var input_index: u32;
        var scale = ${R("uniforms.scales","i",a)};
        if (scale == 1.0) {
          input_index = output_index;
        } else {
          var roi_low = ${R("uniforms.roi","i",n)};
          var roi_hi = ${R("uniforms.roi",`i + ${i.length}`,n)};
          var input_shape_i = ${R("uniforms.input_shape","i",i.length)};
          var output_shape_i = ${R("uniforms.output_shape","i",r.length)};
          var original_idx = getOriginalCoordinateFromResizedCoordinate(output_index, scale, output_shape_i,
                                                                        input_shape_i, roi_low, roi_hi);
          if (!${s} || (original_idx >= 0 && original_idx < ${t.type.value}(input_shape_i))) {
            if (original_idx < 0) {
              input_index = 0;
            } else if (original_idx > ${t.type.value}(input_shape_i - 1)) {
              input_index = input_shape_i - 1;
            } else {
              input_index = u32(getNearestPixelFromOriginal(original_idx, scale < 1));
            }
          } else {
            input_index = u32(original_idx);
          }
        }
        ${e.indicesSet("input_indices","i","input_index")}
      }
      return input_indices;
    }`,Xl=(e,t)=>`
    fn checkInputIndices(input_indices: ${e.type.indices}) -> bool {
      for (var i:u32 = 0; i < ${t.length}; i++) {
        var input_index = ${e.indicesGet("input_indices","i")};
        if (input_index < 0 || input_index >= ${R("uniforms.input_shape","i",t.length)}) {
          return false;
        }
      }
      return true;
    }`,xr=(e,t,i,r)=>e.rank>r?`
    ${e.indicesSet("input_indices",t,"channel")};
    ${e.indicesSet("input_indices",i,"batch")};
`:"",Yl=(e,t,i,r,a)=>{let[n,s,o,u]=i.length===2?[-1,0,1,-1]:[0,2,3,1],l=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, row: u32, col: u32) -> ${l} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",s,`max(0, min(row, ${i[s]} - 1))`)};
      ${e.indicesSet("input_indices",o,`max(0, min(col, ${i[o]} - 1))`)};
      ${xr(e,u,n,2)}
      return ${e.getByIndices("input_indices")};
    }

    fn bilinearInterpolation(output_indices: ${t.type.indices}) -> ${l} {
      var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
      var row:${l} = originalIndices[${s}];
      var col:${l} = originalIndices[${o}];
      ${r?`if (row < 0 || row > (${i[s]} - 1) || col < 0 || col > (${i[o]} - 1)) {
        return ${a};
      }`:""};
      row = max(0, min(row, ${i[s]} - 1));
      col = max(0, min(col, ${i[o]} - 1));
      var row1: u32 = u32(row);
      var col1: u32 = u32(col);
      var row2: u32 = u32(row + 1);
      var col2: u32 = u32(col + 1);
      var channel: u32 = ${i.length>2?`u32(originalIndices[${u}])`:"0"};
      var batch: u32 =  ${i.length>2?`u32(originalIndices[${n}])`:"0"};
      var x11: ${l} = getInputValue(batch, channel, row1, col1);
      var x12: ${l} = getInputValue(batch, channel, row1, col2);
      var x21: ${l} = getInputValue(batch, channel, row2, col1);
      var x22: ${l} = getInputValue(batch, channel, row2, col2);
      var dx1: ${l} = abs(row - ${l}(row1));
      var dx2: ${l} = abs(${l}(row2) - row);
      var dy1: ${l} = abs(col - ${l}(col1));
      var dy2: ${l} = abs(${l}(col2) - col);
      if (row1 == row2) {
        dx1 = 0.5;
        dx2 = 0.5;
      }
      if (col1 == col2) {
        dy1 = 0.5;
        dy2 = 0.5;
      }
      return (x11 * dx2 * dy2 + x12 * dx2 * dy1 + x21 * dx1 * dy2 + x22 * dx1 * dy1);
    }`},Jl=(e,t,i,r,a,n,s,o,u,l)=>{let d=i.length===2,[p,h]=d?[0,1]:[2,3],c=e.type.value,f=m=>{let y=m===p?"row":"col";return`
      fn ${y}CubicInterpolation(input_indices: ${e.type.indices}, output_indices: ${t.type.indices}) -> ${c} {
        var output_index = ${t.indicesGet("output_indices",m)};
        var originalIdx: ${c} = getOriginalCoordinateFromResizedCoordinate(output_index, ${a[m]},
        ${r[m]}, ${i[m]}, ${n[m]}, ${n[m]} + ${i.length});
        var fractOriginalIdx: ${c} = originalIdx - floor(originalIdx);
        var coefs = getCubicInterpolationCoefs(fractOriginalIdx);

        if (${o} && (originalIdx < 0 || originalIdx > (${i[m]} - 1))) {
          return ${u};
        }
        var data: array<${c}, 4> = array<${c}, 4>(0.0, 0.0, 0.0, 0.0);
        for (var i: i32 = -1; i < 3; i++) {
          var ${y}: ${c} = originalIdx + ${c}(i);
          if (${y} < 0 || ${y} >= ${i[m]}) {
            ${l?`coefs[i + 1] = 0.0;
                        continue;`:o?`return ${u};`:`${y} = max(0, min(${y}, ${i[m]} - 1));`};
          }
        var input_indices_copy: ${e.type.indices} = input_indices;
          ${e.indicesSet("input_indices_copy",m,`u32(${y})`)};
          data[i + 1] = ${m===p?e.getByIndices("input_indices_copy"):"rowCubicInterpolation(input_indices_copy, output_indices)"};
        }
        return cubicInterpolation1D(data, coefs);
      }`};return`
    ${f(p)};
    ${f(h)};
  fn getCubicInterpolationCoefs(s: ${c}) -> array<${c}, 4> {
    var absS = abs(s);
    var coeffs: array<${c}, 4> = array<${c}, 4>(0.0, 0.0, 0.0, 0.0);
    var oneMinusAbsS: ${c} = 1.0 - absS;
    var twoMinusAbsS: ${c} = 2.0 - absS;
    var onePlusAbsS: ${c} = 1.0 + absS;
    coeffs[0] = ((${s} * onePlusAbsS - 5 * ${s}) * onePlusAbsS + 8 * ${s}) * onePlusAbsS - 4 * ${s};
    coeffs[1] = ((${s} + 2) * absS - (${s} + 3)) * absS * absS + 1;
    coeffs[2] = ((${s} + 2) * oneMinusAbsS - (${s} + 3)) * oneMinusAbsS * oneMinusAbsS + 1;
    coeffs[3] = ((${s} * twoMinusAbsS - 5 * ${s}) * twoMinusAbsS + 8 * ${s}) * twoMinusAbsS - 4 * ${s};
    return coeffs;
  }

  fn cubicInterpolation1D(x: array<${c}, 4>, coefs: array<${c}, 4>) -> ${c} {
    var coefsSum: ${c} = coefs[0] + coefs[1] + coefs[2] + coefs[3];
    return (x[0] * coefs[0] + x[1] * coefs[1]+ x[2] * coefs[2]+ x[3] * coefs[3]) / coefsSum;
  }

  fn bicubicInterpolation(output_indices: ${t.type.indices}) -> ${c} {
    var input_indices: ${e.type.indices} = output_indices;
    return colCubicInterpolation(input_indices, output_indices);
  }
    `},ed=(e,t,i,r,a)=>{let[n,s,o,u,l]=i.length===3?[-1,0,1,2,-1]:[0,2,3,4,1],d=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, depth:u32, height: u32, width: u32) -> ${d} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",s,`max(0, min(depth, ${i[s]} - 1))`)};
      ${e.indicesSet("input_indices",o,`max(0, min(height, ${i[o]} - 1))`)};
      ${e.indicesSet("input_indices",u,`max(0, min(width, ${i[u]} - 1))`)};
      ${xr(e,l,n,3)}
      return ${e.getByIndices("input_indices")};
    }

    fn trilinearInterpolation(output_indices: ${t.type.indices}) -> ${d} {
      var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
      var depth:${d} = originalIndices[${s}];
      var height:${d} = originalIndices[${o}];
      var width:${d} = originalIndices[${u}];
      ${r?`if (depth < 0 || depth > (${i[s]} - 1) || height < 0 || height > (${i[o]} - 1) || width < 0 || (width > ${i[u]} - 1)) {
      return ${a};
        }`:""};

    depth = max(0, min(depth, ${i[s]} - 1));
      height = max(0, min(height, ${i[o]} - 1));
      width = max(0, min(width, ${i[u]} - 1));
      var depth1: u32 = u32(depth);
      var height1: u32 = u32(height);
      var width1: u32 = u32(width);
      var depth2: u32 = u32(depth + 1);
      var height2: u32 = u32(height + 1);
      var width2: u32 = u32(width + 1);
      var channel: u32 = ${i.length>3?`u32(originalIndices[${l}])`:"0"};
      var batch: u32 =  ${i.length>3?`u32(originalIndices[${n}])`:"0"};

      var x111: ${d} = getInputValue(batch, channel, depth1, height1, width1);
      var x112: ${d} = getInputValue(batch, channel, depth1, height1, width2);
      var x121: ${d} = getInputValue(batch, channel, depth1, height2, width1);
      var x122: ${d} = getInputValue(batch, channel, depth1, height2, width2);
      var x211: ${d} = getInputValue(batch, channel, depth2, height1, width1);
      var x212: ${d} = getInputValue(batch, channel, depth2, height1, width2);
      var x221: ${d} = getInputValue(batch, channel, depth2, height2, width1);
      var x222: ${d} = getInputValue(batch, channel, depth2, height2, width2);
      var dx1: ${d} = abs(depth - ${d}(depth1));
      var dx2: ${d} = abs(${d}(depth2) - depth);
      var dy1: ${d} = abs(height - ${d}(height1));
      var dy2: ${d} = abs(${d}(height2) - height);
      var dz1: ${d} = abs(width - ${d}(width1));
      var dz2: ${d} = abs(${d}(width2) - width);
      if (depth1 == depth2) {
        dx1 = 0.5;
        dx2 = 0.5;
      }
      if (height1 == height2) {
        dy1 = 0.5;
        dy2 = 0.5;
      }
      if (width1 == width2) {
        dz1 = 0.5;
        dz2 = 0.5;
      }
      return (x111 * dx2 * dy2 * dz2 + x112 * dx2 * dy2 * dz1 + x121 * dx2 * dy1 *dz2 + x122 * dx2 * dy1 * dz1 +
              x211 * dx1 * dy2 * dz2 + x212 * dx1 * dy2 * dz1 + x221 * dx1 * dy1 *dz2 + x222 * dx1 * dy1 * dz1);
    }`},td=(e,t,i,r,a,n)=>{let s=e.dims,o=Fl(n,t.axes,s.length),u=jl(s,r,a,t.axes),l=r.slice();r.length===0&&(l=s.map((g,w)=>g===0?1:u[w]/g),t.keepAspectRatioPolicy!=="stretch"&&(u=Kl(s,l,t)));let d=O("output",e.dataType,u.length),p=S("input",e.dataType,s.length),h=k.size(u),c=s.length===u.length&&s.every((g,w)=>g===u[w]),f=t.coordinateTransformMode==="tf_crop_and_resize",m=t.extrapolationValue,y=p.type.value,_=g=>`
      ${c?"":`
      ${Gl(t.coordinateTransformMode,y)};
      ${(()=>{switch(t.mode){case"nearest":return`
              ${Xl(p,s)};
              ${Hl(t.nearestMode,i,y)};
              ${Ql(p,d,s,u,l.length,o.length,f)};
              `;case"linear":return`
              ${Zl(d,s,u,l.length,o.length)};
              ${(()=>{if(s.length===2||s.length===4)return`${Yl(p,d,s,f,m)}`;if(s.length===3||s.length===5)return`${ed(p,d,s,f,m)}`;throw Error("Linear mode only supports input dims 2, 3, 4 and 5 are supported in linear mode.")})()};
            `;case"cubic":return`
            ${(()=>{if(s.length===2||s.length===4)return`${Jl(p,d,s,u,l,o,t.cubicCoeffA,f,t.extrapolationValue,t.excludeOutside)}`;throw Error("Cubic mode only supports input dims 2 and 4 are supported in linear mode.")})()};
            `;default:throw Error("Invalid resize mode")}})()};
      `}
      ${g.registerUniform("output_size","u32").registerUniform("scales","f32",l.length).registerUniform("roi","f32",o.length).declareVariables(p,d)}
      ${g.mainStart()}
        ${g.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
        ${c?"output[global_idx] = input[global_idx];":`
        let output_indices = ${d.offsetToIndices("global_idx")};
        var input_indices: ${p.type.indices};
        ${(()=>{switch(t.mode){case"nearest":return`input_indices = calculateInputIndicesFromOutputIndices(output_indices);
                if (checkInputIndices(input_indices)) {
                  output[global_idx] = ${p.getByIndices("input_indices")};
                } else {
                  output[global_idx] = ${t.extrapolationValue};
                }`;case"linear":return`output[global_idx] = ${s.length===2||s.length===4?"bilinearInterpolation":"trilinearInterpolation"}(output_indices);`;case"cubic":return"output[global_idx] = bicubicInterpolation(output_indices);";default:throw Error(`Unsupported resize mode: ${t.mode}`)}})()};
`}
      }`;return{name:"Resize",shaderCache:{hint:`${t.cacheKey}|${i}|${l.length>0?t.mode==="cubic"?l:l.length:""}|${a.length>0?a:""}|${o.length>0?o:""}|${c}|${t.mode==="nearest"?s.length:s}`,inputDependencies:["rank"]},getShaderSource:_,getRunData:()=>({outputs:[{dims:u,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(h/64)},programUniforms:[{type:12,data:h},{type:1,data:l},{type:1,data:o},...M(s,u)]})}},id=e=>{let t=e.customDataBuffer;return new Uint32Array(t,t.byteOffset,1)[0]},rd=(e,t)=>{let i=[],r=[],a=[],n=id(e);if(t.antialias!==0)throw Error("Only default value (0) for Antialias attribute is supported");Wl(e.inputs,t,n,i,r,a),e.compute(td(e.inputs[0],t,n,i,r,a),{inputs:[0]})},ad=e=>{let t=e.antialias,i=e.axes,r=e.coordinateTransformMode,a=e.cubicCoeffA,n=e.excludeOutside!==0,s=e.extrapolationValue,o=e.keepAspectRatioPolicy,u=e.mode,l=e.nearestMode===""?"simple":e.nearestMode;return Q({antialias:t,axes:i,coordinateTransformMode:r,cubicCoeffA:a,excludeOutside:n,extrapolationValue:s,keepAspectRatioPolicy:o,mode:u,nearestMode:l})}}),nd,sd,od,sh=E(()=>{V(),L(),W(),nd=e=>{if(!e||e.length<3)throw new Error("layerNorm requires at least 3 inputs.");let t=e[0],i=e[1],r=e[2];if(t.dataType!==i.dataType||t.dataType!==r.dataType)throw new Error("All inputs must have the same data type");if(t.dims.length!==3&&t.dims.length!==2)throw new Error("Input must be 2D or 3D");if(i.dims.length!==3&&i.dims.length!==2)throw new Error("Skip must be 2D or 3D");let a=t.dims[t.dims.length-1],n=t.dims[t.dims.length-2];if(i.dims[i.dims.length-1]!==a)throw new Error("Skip must have the same hidden size as input");if(i.dims[i.dims.length-2]!==n)throw new Error("Skip must have the same sequence length as input");if(r.dims.length!==1)throw new Error("Gamma must be 1D");if(r.dims[r.dims.length-1]!==a)throw new Error("Gamma must have the same hidden size as input");if(e.length>3){let s=e[3];if(s.dims.length!==1)throw new Error("Beta must be 1D");if(s.dims[s.dims.length-1]!==a)throw new Error("Beta must have the same hidden size as input")}if(e.length>4){let s=e[4];if(s.dims.length!==1)throw new Error("Bias must be 1D");if(s.dims[s.dims.length-1]!==a)throw new Error("Bias must have the same hidden size as input")}},sd=(e,t,i,r)=>{let a=t.simplified,n=e[0].dims,s=k.size(n),o=n,u=s,l=n.slice(-1)[0],d=r?n.slice(0,-1).concat(1):[],p=!a&&e.length>3,h=e.length>4,c=r&&i>1,f=r&&i>2,m=i>3,y=64,_=ie(l),g=[{type:12,data:u},{type:12,data:_},{type:12,data:l},{type:1,data:t.epsilon}],w=b=>{let x=[{name:"output_size",type:"u32"},{name:"components",type:"u32"},{name:"hidden_size",type:"u32"},{name:"epsilon",type:"f32"}],v=[S("x",e[0].dataType,e[0].dims,_),S("skip",e[1].dataType,e[1].dims,_),S("gamma",e[2].dataType,e[2].dims,_)];p&&v.push(S("beta",e[3].dataType,e[3].dims,_)),h&&v.push(S("bias",e[4].dataType,e[4].dims,_)),v.push(O("output",e[0].dataType,o,_)),c&&v.push(O("mean_output",1,d)),f&&v.push(O("inv_std_output",1,d)),m&&v.push(O("input_skip_bias_sum",e[0].dataType,o,_));let I=ae(e[0].dataType),T=ae(1,_);return`

      ${b.registerUniforms(x).declareVariables(...v)}
      var<workgroup> sum_shared : array<${T}, ${y}>;
      var<workgroup> sum_squared_shared : array<${T}, ${y}>;

      ${b.mainStart([y,1,1])}
        let ix = local_id.x;
        let iy = global_id.x / ${y};

        let hidden_size_vectorized: u32 = uniforms.hidden_size / uniforms.components;
        var stride = hidden_size_vectorized / ${y};
        let offset = ix * stride + iy * hidden_size_vectorized;
        let offset1d = stride * ix;
        if (ix == ${y-1}) {
          stride = hidden_size_vectorized - stride * ix;
        }
        for (var i: u32 = 0; i < stride; i++) {
          let skip_value = skip[offset + i];
          let bias_value = ${h?"bias[offset1d + i]":I+"(0.0)"};
          let input_value = x[offset + i];
          let value = input_value + skip_value + bias_value;
          ${m?"input_skip_bias_sum[offset + i] = value;":""}
          output[offset + i] = value;
          let f32_value = ${rt(I,_,"value")};
          sum_shared[ix] += f32_value;
          sum_squared_shared[ix] += f32_value * f32_value;
        }
        workgroupBarrier();

        var reduce_size : u32 = ${y};
        for (var curr_size = reduce_size >> 1;  curr_size > 0; curr_size = reduce_size >> 1) {
          reduce_size = curr_size + (reduce_size & 1);
          if (ix < curr_size) {
            sum_shared[ix] += sum_shared[ix + reduce_size];
            sum_squared_shared[ix] += sum_squared_shared[ix + reduce_size];
          }
          workgroupBarrier();
        }

        let sum = sum_shared[0];
        let square_sum = sum_squared_shared[0];
        let mean = ${Oe("sum",_)} / f32(uniforms.hidden_size);
        let inv_std_dev = inverseSqrt(${Oe("square_sum",_)} / f32(uniforms.hidden_size) ${a?"":"- mean * mean"} + uniforms.epsilon);
        ${c?"mean_output[global_idx] = mean;":""}
        ${f?"inv_std_output[global_idx] = inv_std_dev;":""}

        for (var i: u32 = 0; i < stride; i++) {
          output[offset + i] = (output[offset + i] ${a?"":`- ${I}(mean)`}) *
            ${I}(inv_std_dev) * gamma[offset1d + i]
            ${p?"+ beta[offset1d + i]":""};
        }
      }`},$=[{dims:o,dataType:e[0].dataType}];return i>1&&$.push({dims:d,dataType:1}),i>2&&$.push({dims:d,dataType:1}),i>3&&$.push({dims:n,dataType:e[0].dataType}),{name:"SkipLayerNormalization",shaderCache:{hint:`${_};${c};${f};${m}`,inputDependencies:e.map((b,x)=>"type")},getShaderSource:w,getRunData:()=>({outputs:$,dispatchGroup:{x:Math.ceil(u/l)},programUniforms:g})}},od=(e,t)=>{nd(e.inputs);let i=[0];e.outputCount>1&&i.push(-3),e.outputCount>2&&i.push(-3),e.outputCount>3&&i.push(3),e.compute(sd(e.inputs,t,e.outputCount,!1),{outputs:i})}}),ud,vt,ld,kr,dd,pd,hd,cd,oh=E(()=>{V(),L(),re(),W(),ud=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");if(t.axes.length!==0){if(t.axes.length!==t.starts.length||t.axes.length!==t.ends.length)throw new Error("axes, starts and ends must have the same length")}else if(t.starts.length!==t.ends.length)throw new Error("starts and ends must have the same length");e.slice(1).forEach((i,r)=>{if(e[r+1].dataType!==6&&e[r+1].dataType!==7)throw new Error(`Input ${r} must be an array of int32 or int64`)})},vt=(e,t)=>{let i=[];if(e.length>t)if(e[t].dataType===7)e[t].getBigInt64Array().forEach(r=>i.push(Number(r)));else if(e[t].dataType===6)e[t].getInt32Array().forEach(r=>i.push(Number(r)));else throw new Error(`Input ${t} must be an array of int32 or int64`);return i},ld=(e,t)=>{if(e.length>1){let i=vt(e,1),r=vt(e,2),a=vt(e,3);return a.length===0&&(a=[...Array(e[0].dims.length).keys()]),Q({starts:i,ends:r,axes:a})}else return t},kr=(e,t,i,r,a)=>{let n=e;return e<0&&(n+=i[r[t]]),a[t]<0?Math.max(0,Math.min(n,i[r[t]]-1)):Math.max(0,Math.min(n,i[r[t]]))},dd=(e,t,i)=>`fn calculateInputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
          var input_indices: ${e.type.indices};
          var carry = 0u;
          for (var i = ${i.length}; i >= 0; i--) {
            let input_shape_i = ${R("uniforms.input_shape","i",i.length)};
            let steps_i = ${R("uniforms.steps","i",i.length)};
            let signs_i = ${R("uniforms.signs","i",i.length)};
            let starts_i = ${R("uniforms.starts","i",i.length)};
            var output_index = ${t.indicesGet("output_indices","i")};
            var input_index = output_index * steps_i + starts_i + carry;
            carry = input_index / input_shape_i;
            input_index = input_index % input_shape_i;
            if (signs_i < 0) {
              input_index = input_shape_i - input_index - 1u + starts_i;
            }
            ${e.indicesSet("input_indices","i","input_index")};
          }
          return input_indices;
      }`,pd=(e,t)=>{let i=e[0].dims,r=k.size(i),a=t.axes.length>0?k.normalizeAxes(t.axes,i.length):[...Array(i.length).keys()],n=vt(e,4);n.forEach(_=>_!==0||(()=>{throw new Error("step cannot be 0")})),n.length===0&&(n=Array(a.length).fill(1));let s=t.starts.map((_,g)=>kr(_,g,i,a,n)),o=t.ends.map((_,g)=>kr(_,g,i,a,n));if(a.length!==s.length||a.length!==o.length)throw new Error("start, ends and axes should have the same number of elements");if(a.length!==i.length)for(let _=0;_<i.length;++_)a.includes(_)||(s.splice(_,0,0),o.splice(_,0,i[_]),n.splice(_,0,1));let u=n.map(_=>Math.sign(_));n.forEach((_,g,w)=>{if(_<0){let $=(o[g]-s[g])/_,b=s[g],x=b+$*n[g];s[g]=x,o[g]=b,w[g]=-_}});let l=i.slice(0);a.forEach((_,g)=>{l[_]=Math.ceil((o[_]-s[_])/n[_])});let d={dims:l,dataType:e[0].dataType},p=O("output",e[0].dataType,l.length),h=S("input",e[0].dataType,e[0].dims.length),c=k.size(l),f=[{name:"outputSize",type:"u32"},{name:"starts",type:"u32",length:s.length},{name:"signs",type:"i32",length:u.length},{name:"steps",type:"u32",length:n.length}],m=[{type:12,data:c},{type:12,data:s},{type:6,data:u},{type:12,data:n},...M(e[0].dims,l)],y=_=>`
      ${_.registerUniforms(f).declareVariables(h,p)}
        ${dd(h,p,i)}
        ${_.mainStart()}
          ${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
          let output_indices = ${p.offsetToIndices("global_idx")};
          let input_indices = calculateInputIndices(output_indices);
          ${p.setByOffset("global_idx",h.getByIndices("input_indices"))}
      }`;return{name:"Slice",shaderCache:{hint:`${u.length}_${s.length}_${n.length}`,inputDependencies:["rank"]},getShaderSource:y,getRunData:()=>({outputs:[d],dispatchGroup:{x:Math.ceil(r/64)},programUniforms:m})}},hd=(e,t)=>{ud(e.inputs,t);let i=ld(e.inputs,t);e.compute(pd(e.inputs,i),{inputs:[0]})},cd=e=>{let t=e.starts,i=e.ends,r=e.axes;return Q({starts:t,ends:i,axes:r})}}),fd,md,gd,_d,uh=E(()=>{V(),L(),re(),Re(),W(),fd=e=>{if(!e||e.length!==1)throw new Error("Softmax op requires 1 input.")},md=(e,t)=>{let i=e.inputs[0],r=i.dims,a=k.size(r),n=r.length,s=k.normalizeAxis(t.axis,n),o=s<r.length-1,u,l=[];o?(l=Array.from({length:n},(v,I)=>I),l[s]=n-1,l[n-1]=s,u=e.compute(me(i,l),{inputs:[i],outputs:[-1]})[0]):u=i;let d=u.dims,p=d[n-1],h=a/p,c=ie(p),f=p/c,m=64;h===1&&(m=256);let y=(v,I)=>I===4?`max(max(${v}.x, ${v}.y), max(${v}.z, ${v}.w))`:I===2?`max(${v}.x, ${v}.y)`:I===3?`max(max(${v}.x, ${v}.y), ${v}.z)`:v,_=S("x",u.dataType,u.dims,c),g=O("result",u.dataType,u.dims,c),w=_.type.value,$=ae(u.dataType)==="f32"?`var threadMax = ${w}(-3.402823e+38f);`:`var threadMax = ${w}(-65504.0h);`,b=v=>`
      var<workgroup> rowMaxShared : ${w};
      var<workgroup> rowSumShared : ${w};
      var<workgroup> threadShared : array<${w}, ${m}>;

      fn getValue(row: i32, col: i32, row_stride: i32) -> ${w} {
        let index = row * row_stride + col;
        return x[index];
      }

      fn setValue(row: i32, col: i32, row_stride: i32, value: ${w}) {
        let index = row * row_stride + col;
        result[index] = value;
      }
      ${v.registerUniform("packedCols","i32").declareVariables(_,g)}
      ${v.mainStart(m)}
        let gindex = i32(global_idx);
        let lindex = i32(local_idx);
        const wg = ${m};
        let row = gindex / wg;
        let cols = uniforms.packedCols;
        let row_stride : i32 = uniforms.packedCols;

        // find the rows max
        ${$}
        for (var col = lindex; col < cols; col += wg) {
          let value = getValue(row, col, row_stride);
          threadMax = max(threadMax, value);
        }
        if (lindex < cols) {
          threadShared[lindex] = threadMax;
        }
        workgroupBarrier();

        var reduceSize = min(cols, wg);
        for (var currSize = reduceSize >> 1;  currSize > 0; currSize = reduceSize >> 1) {
          reduceSize = currSize + (reduceSize & 1);
          if (lindex < currSize) {
            threadShared[lindex] = max(threadShared[lindex], threadShared[lindex + reduceSize]);
          }
          workgroupBarrier();
        }
        if (lindex == 0) {
          rowMaxShared = ${w}(${y("threadShared[0]",c)});
        }
        workgroupBarrier();

        // find the rows sum
        var threadSum = ${w}(0.0);
        for (var col = lindex; col < cols; col += wg) {
          let subExp = exp(getValue(row, col, row_stride) - rowMaxShared);
          threadSum += subExp;
        }
        threadShared[lindex] = threadSum;
        workgroupBarrier();

        for (var currSize = wg >> 1;  currSize > 0; currSize = currSize >> 1) {
          if (lindex < currSize) {
            threadShared[lindex] = threadShared[lindex] + threadShared[lindex + currSize];
          }
          workgroupBarrier();
        }
        if (lindex == 0) {
          rowSumShared = ${w}(${Oe("threadShared[0]",c)});
        }
        workgroupBarrier();

        // calculate final value for each element in the row
        for (var col = lindex; col < cols; col += wg) {
          let value = exp(getValue(row, col, row_stride) - rowMaxShared) / rowSumShared;
          setValue(row, col, row_stride, value);
        }
      }`,x=e.compute({name:"Softmax",shaderCache:{hint:`${c};${m}`,inputDependencies:["type"]},getRunData:()=>({outputs:[{dims:d,dataType:u.dataType}],dispatchGroup:{x:h},programUniforms:[{type:6,data:f}]}),getShaderSource:b},{inputs:[u],outputs:[o?-1:0]})[0];o&&e.compute(me(x,l),{inputs:[x]})},gd=(e,t)=>{fd(e.inputs),md(e,t)},_d=e=>Q({axis:e.axis})}),Ir,yd,$d,wd,bd,lh=E(()=>{V(),L(),W(),Ir=e=>Array.from(e.getBigInt64Array(),Number),yd=e=>{if(!e||e.length!==2)throw new Error("Tile requires 2 inputs.");if(e[0].dataType!==1&&e[0].dataType!==10&&e[0].dataType!==6&&e[0].dataType!==12)throw new Error("Tile only support float, float16, int32, and uint32 data types");if(e[1].dataType!==7)throw new Error("Tile `repeats` input should be of int64 data type");if(e[1].dims.length!==1)throw new Error("Tile `repeats` input should be 1-D");if(Ir(e[1]).length!==e[0].dims.length)throw new Error("Tile `repeats` input should have same number of elements as rank of input data tensor")},$d=(e,t)=>{let i=[];for(let r=0;r<e.length;++r)i.push(e[r]*t[r]);return i},wd=(e,t)=>{let i=e[0].dims,r=t??Ir(e[1]),a=$d(i,r),n=k.size(a),s=e[0].dataType,o=S("input",s,i.length),u=O("output",s,a.length),l=d=>`
      const inputShape = ${o.indices(...i)};
      ${d.registerUniform("output_size","u32").declareVariables(o,u)}
      ${d.mainStart()}
      ${d.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let output_indices = ${u.offsetToIndices("global_idx")};
      var input_indices: ${o.type.indices};
      for (var i = 0; i < ${i.length}; i++) {
        let input_dim_i = ${o.indicesGet("uniforms.input_shape","i")};
        let input_dim_value = ${u.indicesGet("output_indices","i")}  % input_dim_i;

        ${o.indicesSet("input_indices","i","input_dim_value")}
      }
      ${u.setByOffset("global_idx",o.getByIndices("input_indices"))}
    }`;return{name:"Tile",shaderCache:{hint:`${r}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:a,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:[{type:12,data:n},...M(e[0].dims,a)]}),getShaderSource:l}},bd=e=>{yd(e.inputs),e.compute(wd(e.inputs),{inputs:[0]})}}),vd,xd,kd,dh=E(()=>{V(),L(),W(),vd=(e,t,i,r,a)=>{let n=O("output_data",a,i.length,4),s=S("a_data",t[1].dataType,t[1].dims.length,4),o=S("b_data",t[2].dataType,t[2].dims.length,4),u=S("c_data",t[0].dataType,t[0].dims.length,4),l,d=(p,h,c)=>`select(${h}, ${p}, ${c})`;if(!r)l=n.setByOffset("global_idx",d(s.getByOffset("global_idx"),o.getByOffset("global_idx"),u.getByOffset("global_idx")));else{let p=(h,c,f="")=>{let m=`a_data[index_a${c}][component_a${c}]`,y=`b_data[index_b${c}][component_b${c}]`,_=`bool(c_data[index_c${c}] & (0xffu << (component_c${c} * 8)))`;return`
            let output_indices${c} = ${n.offsetToIndices(`global_idx * 4u + ${c}u`)};
            let offset_a${c} = ${s.broadcastedIndicesToOffset(`output_indices${c}`,n)};
            let offset_b${c} = ${o.broadcastedIndicesToOffset(`output_indices${c}`,n)};
            let offset_c${c} = ${u.broadcastedIndicesToOffset(`output_indices${c}`,n)};
            let index_a${c} = offset_a${c} / 4u;
            let index_b${c} = offset_b${c} / 4u;
            let index_c${c} = offset_c${c} / 4u;
            let component_a${c} = offset_a${c} % 4u;
            let component_b${c} = offset_b${c} % 4u;
            let component_c${c} = offset_c${c} % 4u;
            ${h}[${c}] = ${f}(${d(m,y,_)});
          `};a===9?l=`
            var data = vec4<u32>(0);
            ${p("data",0,"u32")}
            ${p("data",1,"u32")}
            ${p("data",2,"u32")}
            ${p("data",3,"u32")}
            output_data[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:l=`
            ${p("output_data[global_idx]",0)}
            ${p("output_data[global_idx]",1)}
            ${p("output_data[global_idx]",2)}
            ${p("output_data[global_idx]",3)}
          `}return`
        ${e.registerUniform("vec_size","u32").declareVariables(u,s,o,n)}
        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${l}
      }`},xd=e=>{let t=e[1].dims,i=e[2].dims,r=e[0].dims,a=e[1].dataType,n=!(k.areEqual(t,i)&&k.areEqual(i,r)),s=t,o=k.size(t);if(n){let l=tt.calcShape(tt.calcShape(t,i,!1),r,!1);if(!l)throw new Error("Can't perform where op on the given tensors");s=l,o=k.size(s)}let u=Math.ceil(o/4);return{name:"Where",shaderCache:{inputDependencies:["rank","rank","rank"]},getShaderSource:l=>vd(l,e,s,n,a),getRunData:()=>({outputs:[{dims:s,dataType:a}],dispatchGroup:{x:Math.ceil(o/64/4)},programUniforms:[{type:12,data:u},...M(r,t,i,s)]})}},kd=e=>{e.compute(xd(e.inputs))}}),Id,ph=E(()=>{Ip(),qi(),Sp(),Tp(),zp(),Ep(),Cp(),Dp(),Pp(),Up(),qp(),Np(),Vp(),Lp(),Wp(),Gp(),Hp(),Fp(),jp(),Kp(),Zp(),Qp(),Xp(),Yp(),Jp(),Pu(),eh(),th(),ih(),rh(),ah(),Mi(),nh(),ju(),sh(),oh(),uh(),Gu(),lh(),Re(),Wi(),dh(),Id=new Map([["Abs",[as]],["Acos",[ns]],["Acosh",[ss]],["Add",[js]],["ArgMax",[Wn,Ui]],["ArgMin",[Ln,Ui]],["Asin",[os]],["Asinh",[us]],["Atan",[ls]],["Atanh",[ds]],["Attention",[Zn]],["AveragePool",[xl,vl]],["BatchNormalization",[Jn]],["BiasAdd",[is]],["BiasSplitGelu",[Gs]],["Cast",[hs,ps]],["Ceil",[ms]],["Clip",[fs]],["Concat",[oo,uo]],["Conv",[ir,er]],["ConvTranspose",[Mo,Oo]],["Cos",[gs]],["Cosh",[_s]],["CumSum",[Uo,qo]],["DepthToSpace",[Wo,Go]],["DequantizeLinear",[Al,Ol]],["Div",[Ks]],["Einsum",[Qo,Xo]],["Elu",[ys,gt]],["Equal",[Zs]],["Erf",[$s]],["Exp",[ws]],["Expand",[tu]],["FastGelu",[ru]],["Floor",[bs]],["FusedConv",[ir,er]],["Gather",[ou,su]],["GatherElements",[yu,_u]],["GatherBlockQuantized",[cu,fu]],["GatherND",[lu,du]],["Gelu",[vs]],["Gemm",[vu,bu]],["GlobalAveragePool",[Il,kl]],["GlobalMaxPool",[El,zl]],["Greater",[Js]],["GreaterOrEqual",[to]],["GridSample",[Bu,Au]],["GroupQueryAttention",[Xu]],["HardSigmoid",[Cs,Es]],["InstanceNormalization",[el]],["LayerNormalization",[rl]],["LeakyRelu",[xs,gt]],["Less",[eo]],["LessOrEqual",[io]],["Log",[Us]],["MatMul",[nl]],["MatMulNBits",[ll,dl]],["MaxPool",[Sl,Tl]],["Mul",[Qs]],["MultiHeadAttention",[Mu,Ru]],["Neg",[Is]],["Not",[ks]],["Pad",[$l]],["Pow",[Xs]],["QuickGelu",[Vs,gt]],["Range",[Ml]],["Reciprocal",[Ss]],["ReduceMin",[Pn]],["ReduceMean",[An]],["ReduceMax",[Mn]],["ReduceSum",[qn]],["ReduceProd",[Un]],["ReduceL1",[On]],["ReduceL2",[Rn]],["ReduceLogSum",[Vn]],["ReduceLogSumExp",[Dn]],["ReduceSumSquare",[Nn]],["Relu",[Ts]],["Resize",[rd,ad]],["RotaryEmbedding",[Fu]],["ScatterND",[Nl,ql]],["Sigmoid",[zs]],["Sin",[Bs]],["Sinh",[As]],["Slice",[hd,cd]],["SkipLayerNormalization",[od]],["Split",[Lu,Wu]],["Sqrt",[Os]],["Softmax",[gd,_d]],["Sub",[Ys]],["Tan",[Rs]],["Tanh",[Ds]],["ThresholdedRelu",[Ps,gt]],["Tile",[bd]],["Transpose",[Ya,Ja]],["Where",[kd]]])}),Sd,hh=E(()=>{we(),Ce(),W(),Sd=class{constructor(e){this.backend=e,this.repo=new Map,this.attributesBound=!1}getArtifact(e){return this.repo.get(e)}setArtifact(e,t){this.repo.set(e,t)}run(e,t,i,r,a){$e(e.programInfo.name);let n=this.backend.device,s=this.backend.getComputePassEncoder();this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2);let o=[];for(let l of t)o.push({binding:o.length,resource:{buffer:l.buffer}});for(let l of i)o.push({binding:o.length,resource:{buffer:l.buffer}});a&&o.push({binding:o.length,resource:a});let u=n.createBindGroup({layout:e.computePipeline.getBindGroupLayout(0),entries:o,label:e.programInfo.name});if(this.backend.sessionStatus==="capturing"){let l={kernelId:this.backend.currentKernelId,computePipeline:e.computePipeline,bindGroup:u,dispatchGroup:r};this.backend.capturedCommandList.get(this.backend.currentSessionId).push(l)}s.setPipeline(e.computePipeline),s.setBindGroup(0,u),s.dispatchWorkgroups(...r),this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2+1),this.backend.pendingDispatchNumber++,(this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber||this.backend.queryType==="at-passes")&&this.backend.endComputePass(),this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber&&this.backend.flush(),_e(e.programInfo.name)}dispose(){}build(e,t){$e(e.name);let i=this.backend.device,r=[];[{feature:"shader-f16",extension:"f16"},{feature:"subgroups",extension:"subgroups"}].forEach(l=>{i.features.has(l.feature)&&r.push(`enable ${l.extension};`)});let a=Fa(t,this.backend.device.limits),n=e.getShaderSource(a),s=`${r.join(`
`)}
${a.additionalImplementations}
${n}`,o=i.createShaderModule({code:s,label:e.name});F("verbose",()=>`[WebGPU] ${e.name} shader code: ${s}`);let u=i.createComputePipeline({compute:{module:o,entryPoint:"main"},layout:"auto",label:e.name});return _e(e.name),{programInfo:e,computePipeline:u,uniformVariablesInfo:a.variablesInfo}}normalizeDispatchGroupSize(e){let t=typeof e=="number"?e:e.x,i=typeof e=="number"?1:e.y||1,r=typeof e=="number"?1:e.z||1,a=this.backend.device.limits.maxComputeWorkgroupsPerDimension;if(t<=a&&i<=a&&r<=a)return[t,i,r];let n=t*i*r,s=Math.ceil(Math.sqrt(n));if(s>a){if(s=Math.ceil(Math.cbrt(n)),s>a)throw new Error("Total dispatch size exceeds WebGPU maximum.");return[s,s,s]}else return[s,s,1]}}}),Td={};Je(Td,{WebGpuBackend:()=>Bd});var zd,Ed,Cd,Bd,ch=E(()=>{we(),V(),Ce(),Aa(),xp(),ph(),hh(),zd=(e,t)=>{if(t.length!==e.length)throw new Error(`inputDependencies length ${t.length} is not equal to inputTensors length ${e.length}.`);let i=[];for(let r=0;r<e.length;++r){let a=e[r].dataType;switch(t[r]){case"none":{i.push("");break}case"type":{i.push(`${a}`);break}case"rank":{let n=e[r].dims.length;i.push(`${a};${n}`);break}case"dims":{let n=e[r].dims.join(",");i.push(`${a};${n}`);break}default:throw new Error(`unsupported input dependency: ${t[r]}`)}}return i.join("|")},Ed=(e,t,i)=>{var a,n;let r=e.name;return(a=e.shaderCache)!=null&&a.hint&&(r+="["+e.shaderCache.hint+"]"),r+=":"+i+`:${zd(t,((n=e.shaderCache)==null?void 0:n.inputDependencies)??new Array(t.length).fill("dims"))}`,r},Cd=class{constructor(e){e&&(this.architecture=e.architecture,this.vendor=e.vendor)}isArchitecture(e){return this.architecture===e}isVendor(e){return this.vendor===e}},Bd=class{constructor(){this.currentSessionId=null,this.currentKernelId=null,this.commandEncoder=null,this.computePassEncoder=null,this.maxDispatchNumber=16,this.pendingDispatchNumber=0,this.pendingKernels=[],this.pendingQueries=new Map,this.sessionStatus="default",this.capturedCommandList=new Map,this.capturedPendingKernels=new Map,this.sessionExternalDataMapping=new Map}get currentKernelCustomData(){if(this.currentKernelId===null)throw new Error("currentKernelCustomData(): currentKernelId is null. (should not happen)");let e=this.kernelCustomData.get(this.currentKernelId);return e||(e={},this.kernelCustomData.set(this.currentKernelId,e)),e}async initialize(e,t){this.env=e;let i=[],r={requiredLimits:{maxComputeWorkgroupStorageSize:t.limits.maxComputeWorkgroupStorageSize,maxComputeWorkgroupsPerDimension:t.limits.maxComputeWorkgroupsPerDimension,maxStorageBufferBindingSize:t.limits.maxStorageBufferBindingSize,maxBufferSize:t.limits.maxBufferSize,maxComputeInvocationsPerWorkgroup:t.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupSizeX:t.limits.maxComputeWorkgroupSizeX,maxComputeWorkgroupSizeY:t.limits.maxComputeWorkgroupSizeY,maxComputeWorkgroupSizeZ:t.limits.maxComputeWorkgroupSizeZ},requiredFeatures:i},a=n=>t.features.has(n)&&i.push(n)&&!0;a("chromium-experimental-timestamp-query-inside-passes")||a("timestamp-query"),a("shader-f16"),a("subgroups"),this.device=await t.requestDevice(r),this.adapterInfo=new Cd(t.info||await t.requestAdapterInfo()),this.gpuDataManager=La(this),this.programManager=new Sd(this),this.kernels=new Map,this.kernelPersistentData=new Map,this.kernelCustomData=new Map,wi(e.logLevel,!!e.debug),this.device.onuncapturederror=n=>{n.error instanceof GPUValidationError&&console.error(`An uncaught WebGPU validation error was raised: ${n.error.message}`)},Object.defineProperty(this.env.webgpu,"device",{value:this.device,writable:!1,enumerable:!0,configurable:!1}),Object.defineProperty(this.env.webgpu,"adapter",{value:t,writable:!1,enumerable:!0,configurable:!1}),this.setQueryType()}dispose(){typeof this.querySet<"u"&&this.querySet.destroy(),this.gpuDataManager.dispose()}getCommandEncoder(){return this.commandEncoder||(this.commandEncoder=this.device.createCommandEncoder()),this.commandEncoder}getComputePassEncoder(){if(!this.computePassEncoder){let e=this.getCommandEncoder(),t={};this.queryType==="at-passes"&&(t.timestampWrites={querySet:this.querySet,beginningOfPassWriteIndex:this.pendingDispatchNumber*2,endOfPassWriteIndex:this.pendingDispatchNumber*2+1}),this.computePassEncoder=e.beginComputePass(t)}return this.computePassEncoder}endComputePass(){this.computePassEncoder&&(this.computePassEncoder.end(),this.computePassEncoder=null)}flush(){if(!this.commandEncoder)return;$e(),this.endComputePass();let e;this.queryType!=="none"&&(this.commandEncoder.resolveQuerySet(this.querySet,0,this.pendingDispatchNumber*2,this.queryResolveBuffer,0),e=this.device.createBuffer({size:this.pendingDispatchNumber*2*8,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),this.pendingQueries.set(e,this.pendingKernels),this.pendingKernels=[],this.commandEncoder.copyBufferToBuffer(this.queryResolveBuffer,0,e,0,this.pendingDispatchNumber*2*8)),this.device.queue.submit([this.commandEncoder.finish()]),this.gpuDataManager.refreshPendingBuffers(),this.commandEncoder=null,this.pendingDispatchNumber=0,this.queryType!=="none"&&e.mapAsync(GPUMapMode.READ).then(()=>{var r;let t=new BigUint64Array(e.getMappedRange()),i=this.pendingQueries.get(e);for(let a=0;a<t.length/2;a++){let n=i[a],s=n.kernelId,o=this.kernels.get(s),u=o.kernelType,l=o.kernelName,d=n.programName,p=n.inputTensorViews,h=n.outputTensorViews,c=t[a*2],f=t[a*2+1];typeof this.queryTimeBase>"u"&&(this.queryTimeBase=c);let m=Number(c-this.queryTimeBase),y=Number(f-this.queryTimeBase);if(!Number.isSafeInteger(m)||!Number.isSafeInteger(y))throw new RangeError("incorrect timestamp range");if((r=this.env.webgpu.profiling)!=null&&r.ondata)this.env.webgpu.profiling.ondata({version:1,inputsMetadata:p.map(_=>({dims:_.dims,dataType:Ee(_.dataType)})),outputsMetadata:h.map(_=>({dims:_.dims,dataType:Ee(_.dataType)})),kernelId:s,kernelType:u,kernelName:l,programName:d,startTime:m,endTime:y});else{let _="";p.forEach((w,$)=>{_+=`input[${$}]: [${w.dims}] | ${Ee(w.dataType)}, `});let g="";h.forEach((w,$)=>{g+=`output[${$}]: [${w.dims}] | ${Ee(w.dataType)}, `}),console.log(`[profiling] kernel "${s}|${u}|${l}|${d}" ${_}${g}execution time: ${y-m} ns`)}pt("GPU",`${d}::${c}::${f}`)}e.unmap(),this.pendingQueries.delete(e)}),_e()}run(e,t,i,r,a,n){$e(e.name);let s=[];for(let g=0;g<t.length;++g){let w=t[g].data;if(w===0)continue;let $=this.gpuDataManager.get(w);if(!$)throw new Error(`no GPU data for input: ${w}`);s.push($)}let{outputs:o,dispatchGroup:u,programUniforms:l}=e.getRunData(t),d=i.length===0?o.map((g,w)=>w):i;if(d.length!==o.length)throw new Error(`Output size ${d.length} must be equal to ${o.length}.`);let p=[],h=[];for(let g=0;g<o.length;++g){if(!Number.isInteger(d[g])||d[g]<-3||d[g]>=n)throw new Error(`Invalid output index: ${d[g]}`);if(d[g]===-3)continue;let w=d[g]===-1,$=d[g]===-2,b=w||$?a(o[g].dataType,o[g].dims):r(d[g],o[g].dataType,o[g].dims);if(p.push(b),b.data===0)continue;let x=this.gpuDataManager.get(b.data);if(!x)throw new Error(`no GPU data for output: ${b.data}`);if(w&&this.temporaryData.push(x),$){let v=this.kernelPersistentData.get(this.currentKernelId);v||(v=[],this.kernelPersistentData.set(this.currentKernelId,v)),v.push(x)}h.push(x)}if(s.length!==t.length||h.length!==p.length){if(h.length===0)return _e(e.name),p;throw new Error(`Program ${e.name} has zero-sized tensor(s) in inputs or outputs. This is not supported now.`)}let c;if(l){let g=0,w=[];l.forEach(v=>{let I=typeof v.data=="number"?[v.data]:v.data;if(I.length===0)return;let T=v.type===10?2:4,C,q;v.type===10?(q=I.length>4?16:I.length>2?8:I.length*T,C=I.length>4?16:T*I.length):(q=I.length<=2?I.length*T:16,C=16),g=Math.ceil(g/q)*q,w.push(g);let D=v.type===10?8:4;g+=I.length>4?Math.ceil(I.length/D)*C:I.length*T});let $=16;g=Math.ceil(g/$)*$;let b=new ArrayBuffer(g);l.forEach((v,I)=>{let T=w[I],C=typeof v.data=="number"?[v.data]:v.data;if(v.type===6)new Int32Array(b,T,C.length).set(C);else if(v.type===12)new Uint32Array(b,T,C.length).set(C);else if(v.type===10)new Uint16Array(b,T,C.length).set(C);else if(v.type===1)new Float32Array(b,T,C.length).set(C);else throw new Error(`Unsupported uniform type: ${Ee(v.type)}`)});let x=this.gpuDataManager.create(g,GPUBufferUsage.COPY_DST|GPUBufferUsage.UNIFORM);this.device.queue.writeBuffer(x.buffer,0,b,0,g),this.gpuDataManager.release(x.id),c={offset:0,size:g,buffer:x.buffer}}let f=this.programManager.normalizeDispatchGroupSize(u),m=f[1]===1&&f[2]===1,y=Ed(e,t,m),_=this.programManager.getArtifact(y);if(_||(_=this.programManager.build(e,f),this.programManager.setArtifact(y,_),F("info",()=>`[artifact] key: ${y}, programName: ${e.name}`)),l&&_.uniformVariablesInfo){if(l.length!==_.uniformVariablesInfo.length)throw new Error(`Uniform variables count mismatch: expect ${_.uniformVariablesInfo.length}, got ${l.length} in program "${_.programInfo.name}".`);for(let g=0;g<l.length;g++){let w=l[g],$=w.type,b=typeof w.data=="number"?1:w.data.length,[x,v]=_.uniformVariablesInfo[g];if($!==x||b!==v)throw new Error(`Uniform variable ${g} mismatch: expect type ${x} with size ${v}, got type ${$} with size ${b} in program "${_.programInfo.name}".`)}}if(F("info",()=>`[ProgramManager] run "${e.name}" (key=${y}) with ${f[0]}x${f[1]}x${f[2]}`),this.queryType!=="none"||this.sessionStatus==="capturing"){let g={kernelId:this.currentKernelId,programName:_.programInfo.name,inputTensorViews:t,outputTensorViews:p};this.pendingKernels.push(g),this.sessionStatus==="capturing"&&this.capturedPendingKernels.get(this.currentSessionId).push(g)}return this.programManager.run(_,s,h,f,c),_e(e.name),p}upload(e,t){this.gpuDataManager.upload(e,t)}memcpy(e,t){this.gpuDataManager.memcpy(e,t)}async download(e,t){await this.gpuDataManager.download(e,t)}alloc(e){return this.gpuDataManager.create(e).id}free(e){return this.gpuDataManager.release(e)}createKernel(e,t,i,r){let a=Id.get(e);if(!a)throw new Error(`kernel not implemented: ${e}`);let n={kernelType:e,kernelName:r,kernelEntry:a[0],attributes:[a[1],i]};this.kernels.set(t,n)}releaseKernel(e){let t=this.kernelPersistentData.get(e);if(t){for(let i of t)this.gpuDataManager.release(i.id);this.kernelPersistentData.delete(e)}this.kernelCustomData.delete(e),this.kernels.delete(e)}computeKernel(e,t,i){let r=this.kernels.get(e);if(!r)throw new Error(`kernel not created: ${e}`);let a=r.kernelType,n=r.kernelName,s=r.kernelEntry,o=r.attributes;if(this.currentKernelId!==null)throw new Error(`kernel "[${a}] ${n}" is not allowed to be called recursively`);this.currentKernelId=e,o[0]&&(o[1]=o[0](o[1]),o[0]=void 0),F("info",()=>`[WebGPU] Start to run kernel "[${a}] ${n}"...`);let u=this.env.debug;this.temporaryData=[];try{return u&&this.device.pushErrorScope("validation"),s(t,o[1]),0}catch(l){return i.push(Promise.resolve(`[WebGPU] Kernel "[${a}] ${n}" failed. ${l}`)),1}finally{u&&i.push(this.device.popErrorScope().then(l=>l?`GPU validation error for kernel "[${a}] ${n}": ${l.message}`:null));for(let l of this.temporaryData)this.gpuDataManager.release(l.id);this.temporaryData=[],this.currentKernelId=null}}registerBuffer(e,t,i,r){let a=this.sessionExternalDataMapping.get(e);a||(a=new Map,this.sessionExternalDataMapping.set(e,a));let n=a.get(t),s=this.gpuDataManager.registerExternalBuffer(i,r,n);return a.set(t,[s,i]),s}unregisterBuffers(e){let t=this.sessionExternalDataMapping.get(e);t&&(t.forEach(i=>this.gpuDataManager.unregisterExternalBuffer(i[0])),this.sessionExternalDataMapping.delete(e))}getBuffer(e){let t=this.gpuDataManager.get(e);if(!t)throw new Error(`no GPU data for buffer: ${e}`);return t.buffer}createDownloader(e,t,i){return async()=>{let r=await Bi(this,e,t);return bi(r.buffer,i)}}writeTimestamp(e){this.queryType==="inside-passes"&&this.computePassEncoder.writeTimestamp(this.querySet,e)}setQueryType(){var e;this.queryType="none",(((e=this.env.webgpu.profiling)==null?void 0:e.mode)==="default"||(typeof this.env.trace>"u"?this.env.wasm.trace:this.env.trace))&&(this.device.features.has("chromium-experimental-timestamp-query-inside-passes")?this.queryType="inside-passes":this.device.features.has("timestamp-query")&&(this.queryType="at-passes"),this.queryType!=="none"&&typeof this.querySet>"u"&&(this.querySet=this.device.createQuerySet({type:"timestamp",count:this.maxDispatchNumber*2}),this.queryResolveBuffer=this.device.createBuffer({size:this.maxDispatchNumber*2*8,usage:GPUBufferUsage.COPY_SRC|GPUBufferUsage.QUERY_RESOLVE})))}captureBegin(){F("info","captureBegin"),this.capturedCommandList.get(this.currentSessionId)||this.capturedCommandList.set(this.currentSessionId,[]),this.capturedPendingKernels.get(this.currentSessionId)||this.capturedPendingKernels.set(this.currentSessionId,[]),this.flush(),this.sessionStatus="capturing"}captureEnd(){F("info","captureEnd"),this.flush(),this.sessionStatus="default"}replay(){F("info","replay"),this.sessionStatus="replaying";let e=this.capturedCommandList.get(this.currentSessionId),t=this.capturedPendingKernels.get(this.currentSessionId),i=e.length;this.pendingKernels=[];for(let r=0;r<i;r++){let a=this.getComputePassEncoder(),n=e[r];this.writeTimestamp(this.pendingDispatchNumber*2),a.setPipeline(n.computePipeline),a.setBindGroup(0,n.bindGroup),a.dispatchWorkgroups(...n.dispatchGroup),this.writeTimestamp(this.pendingDispatchNumber*2+1),this.pendingDispatchNumber++,this.queryType!=="none"&&this.pendingKernels.push(t[r]),(this.pendingDispatchNumber>=this.maxDispatchNumber||this.queryType==="at-passes")&&this.endComputePass(),this.pendingDispatchNumber>=this.maxDispatchNumber&&this.flush()}this.flush(),this.sessionStatus="default"}onCreateSession(){this.gpuDataManager.onCreateSession()}onReleaseSession(e){this.unregisterBuffers(e),this.capturedCommandList.has(e)&&this.capturedCommandList.delete(e),this.capturedPendingKernels.has(e)&&this.capturedPendingKernels.delete(e),this.gpuDataManager.onReleaseSession(e)}onRunStart(e){this.currentSessionId=e,this.setQueryType()}}}),Ad={};Je(Ad,{init:()=>Rd});var Gt,Od,Rd,fh=E(()=>{V(),Ce(),L(),vp(),Gt=class ep{constructor(t,i,r,a){this.module=t,this.dataType=i,this.data=r,this.dims=a}getFloat32Array(){if(this.dataType!==1)throw new Error("Invalid data type");let t=k.size(this.dims);return t===0?new Float32Array:new Float32Array(this.module.HEAP8.buffer,this.data,t)}getBigInt64Array(){if(this.dataType!==7)throw new Error("Invalid data type");let t=k.size(this.dims);return t===0?new BigInt64Array:new BigInt64Array(this.module.HEAP8.buffer,this.data,t)}getInt32Array(){if(this.dataType!==6)throw new Error("Invalid data type");let t=k.size(this.dims);return t===0?new Int32Array:new Int32Array(this.module.HEAP8.buffer,this.data,t)}getUint16Array(){if(this.dataType!==10&&this.dataType!==4)throw new Error("Invalid data type");let t=k.size(this.dims);return t===0?new Uint16Array:new Uint16Array(this.module.HEAP8.buffer,this.data,t)}reshape(t){if(k.size(t)!==k.size(this.dims))throw new Error("Invalid new shape");return new ep(this.module,this.dataType,this.data,t)}},Od=class{constructor(e,t,i){this.module=e,this.backend=t,this.customDataOffset=0,this.customDataSize=0,this.adapterInfo=t.adapterInfo;let r=e.PTR_SIZE,a=i/e.PTR_SIZE,n=r===4?"i32":"i64";this.opKernelContext=Number(e.getValue(r*a++,n));let s=Number(e.getValue(r*a++,n));this.outputCount=Number(e.getValue(r*a++,n)),this.customDataOffset=Number(e.getValue(r*a++,"*")),this.customDataSize=Number(e.getValue(r*a++,n));let o=[];for(let u=0;u<s;u++){let l=Number(e.getValue(r*a++,n)),d=Number(e.getValue(r*a++,"*")),p=Number(e.getValue(r*a++,n)),h=[];for(let c=0;c<p;c++)h.push(Number(e.getValue(r*a++,n)));o.push(new Gt(e,l,d,h))}this.inputs=o}get kernelCustomData(){return this.backend.currentKernelCustomData}get customDataBuffer(){return this.module.HEAPU8.subarray(this.customDataOffset,this.customDataOffset+this.customDataSize)}compute(e,t){var s;let i=((s=t==null?void 0:t.inputs)==null?void 0:s.map(o=>typeof o=="number"?this.inputs[o]:o))??this.inputs,r=(t==null?void 0:t.outputs)??[],a=(o,u,l)=>new Gt(this.module,u,this.output(o,l),l),n=(o,u)=>{let l=Ve(o,u);if(!l)throw new Error(`Unsupported data type: ${o}`);let d=l>0?this.backend.gpuDataManager.create(l).id:0;return new Gt(this.module,o,d,u)};return this.backend.run(e,i,r,a,n,this.outputCount)}output(e,t){let i=this.module.stackSave();try{let r=this.module.PTR_SIZE,a=r===4?"i32":"i64",n=this.module.stackAlloc((1+t.length)*r);this.module.setValue(n,t.length,a);for(let s=0;s<t.length;s++)this.module.setValue(n+r*(s+1),t[s],a);return this.module._JsepOutput(this.opKernelContext,e,n)}catch(r){throw new Error(`Failed to generate kernel's output[${e}] with dims [${t}]. If you are running with pre-allocated output, please make sure the output type/dims are correct. Error: ${r}`)}finally{this.module.stackRestore(i)}}},Rd=async(e,t,i,r)=>{let a=t.jsepInit;if(!a)throw new Error("Failed to initialize JSEP. The WebAssembly module is not built with JSEP support.");if(e==="webgpu"){let n=(ch(),ut(Td)).WebGpuBackend,s=new n;await s.initialize(i,r),a("webgpu",[s,o=>s.alloc(Number(o)),o=>s.free(o),(o,u,l,d=!1)=>{if(d)F("verbose",()=>`[WebGPU] jsepCopyGpuToGpu: src=${Number(o)}, dst=${Number(u)}, size=${Number(l)}`),s.memcpy(Number(o),Number(u));else{F("verbose",()=>`[WebGPU] jsepCopyCpuToGpu: dataOffset=${Number(o)}, gpuDataId=${Number(u)}, size=${Number(l)}`);let p=t.HEAPU8.subarray(Number(o>>>0),Number(o>>>0)+Number(l));s.upload(Number(u),p)}},async(o,u,l)=>{F("verbose",()=>`[WebGPU] jsepCopyGpuToCpu: gpuDataId=${o}, dataOffset=${u}, size=${l}`),await s.download(Number(o),()=>t.HEAPU8.subarray(Number(u)>>>0,Number(u+l)>>>0))},(o,u,l)=>s.createKernel(o,Number(u),l,t.UTF8ToString(t._JsepGetNodeName(Number(u)))),o=>s.releaseKernel(o),(o,u,l,d)=>{F("verbose",()=>`[WebGPU] jsepRun: sessionHandle=${l}, kernel=${o}, contextDataOffset=${u}`);let p=new Od(t,s,Number(u));return s.computeKernel(Number(o),p,d)},()=>s.captureBegin(),()=>s.captureEnd(),()=>s.replay()])}else{let n=new Ua(i);a("webnn",[n,()=>n.reserveTensorId(),s=>n.releaseTensorId(s),async(s,o,u,l,d)=>n.ensureTensor(s,o,u,l,d),(s,o)=>{n.uploadTensor(s,o)},async(s,o)=>n.downloadTensor(s,o)])}}}),Dd,Sr,Tr,De,Md,zr,Ht,Er,Cr,Br,Ar,Or,Rr,Pd=E(()=>{$p(),wp(),V(),Ne(),fi(),va(),Dd=(e,t)=>{ee()._OrtInit(e,t)!==0&&Y("Can't initialize onnxruntime.")},Sr=async e=>{Dd(e.wasm.numThreads,Ct(e.logLevel))},Tr=async(e,t)=>{var i,r;(r=(i=ee()).asyncInit)==null||r.call(i);{let a=(fh(),ut(Ad)).init;if(t==="webgpu"){if(typeof navigator>"u"||!navigator.gpu)throw new Error("WebGPU is not supported in current environment");let n=e.webgpu.adapter;if(n){if(typeof n.limits!="object"||typeof n.features!="object"||typeof n.requestDevice!="function")throw new Error("Invalid GPU adapter set in `env.webgpu.adapter`. It must be a GPUAdapter object.")}else{let s=e.webgpu.powerPreference;if(s!==void 0&&s!=="low-power"&&s!=="high-performance")throw new Error(`Invalid powerPreference setting: "${s}"`);let o=e.webgpu.forceFallbackAdapter;if(o!==void 0&&typeof o!="boolean")throw new Error(`Invalid forceFallbackAdapter setting: "${o}"`);if(n=await navigator.gpu.requestAdapter({powerPreference:s,forceFallbackAdapter:o}),!n)throw new Error('Failed to get GPU adapter. You may need to enable flag "--enable-unsafe-webgpu" if you are using Chrome.')}await a("webgpu",ee(),e,n)}if(t==="webnn"){if(typeof navigator>"u"||!navigator.ml)throw new Error("WebNN is not supported in current environment");await a("webnn",ee(),e)}}},De=new Map,Md=e=>{let t=ee(),i=t.stackSave();try{let r=t.PTR_SIZE,a=t.stackAlloc(2*r);t._OrtGetInputOutputCount(e,a,a+r)!==0&&Y("Can't get session input/output count.");let n=r===4?"i32":"i64";return[Number(t.getValue(a,n)),Number(t.getValue(a+r,n))]}finally{t.stackRestore(i)}},zr=(e,t)=>{let i=ee(),r=i.stackSave(),a=0;try{let n=i.PTR_SIZE,s=i.stackAlloc(2*n);i._OrtGetInputOutputMetadata(e,t,s,s+n)!==0&&Y("Can't get session input/output metadata.");let o=Number(i.getValue(s,"*"));a=Number(i.getValue(s+n,"*"));let u=i.HEAP32[a/4];if(u===0)return[o,0];let l=i.HEAPU32[a/4+1],d=[];for(let p=0;p<l;p++){let h=Number(i.getValue(a+8+p*n,"*"));d.push(h!==0?i.UTF8ToString(h):Number(i.getValue(a+8+(p+l)*n,"*")))}return[o,u,d]}finally{i.stackRestore(r),a!==0&&i._OrtFree(a)}},Ht=e=>{let t=ee(),i=t._malloc(e.byteLength);if(i===0)throw new Error(`Can't create a session. failed to allocate a buffer of size ${e.byteLength}.`);return t.HEAPU8.set(e,i),[i,e.byteLength]},Er=async(e,t)=>{var p,h,c,f;let i,r,a=ee();Array.isArray(e)?[i,r]=e:e.buffer===a.HEAPU8.buffer?[i,r]=[e.byteOffset,e.byteLength]:[i,r]=Ht(e);let n=0,s=0,o=0,u=[],l=[],d=[];try{if([s,u]=await ba(t),(t==null?void 0:t.externalData)&&a.mountExternalData){let I=[];for(let T of t.externalData){let C=typeof T=="string"?T:T.path;I.push($i(typeof T=="string"?T:T.data).then(q=>{a.mountExternalData(C,q)}))}await Promise.all(I)}for(let I of(t==null?void 0:t.executionProviders)??[])if((typeof I=="string"?I:I.name)==="webnn"){if(a.shouldTransferToMLTensor=!1,typeof I!="string"){let T=I,C=T==null?void 0:T.context,q=T==null?void 0:T.gpuDevice,D=T==null?void 0:T.deviceType,P=T==null?void 0:T.powerPreference;C?a.currentContext=C:q?a.currentContext=await a.webnnCreateMLContext(q):a.currentContext=await a.webnnCreateMLContext({deviceType:D,powerPreference:P})}else a.currentContext=await a.webnnCreateMLContext();break}n=await a._OrtCreateSession(i,r,s),(p=a.webgpuOnCreateSession)==null||p.call(a,n),n===0&&Y("Can't create a session."),(h=a.jsepOnCreateSession)==null||h.call(a),a.currentContext&&(a.webnnRegisterMLContext(n,a.currentContext),a.currentContext=void 0,a.shouldTransferToMLTensor=!0);let[m,y]=Md(n),_=!!(t!=null&&t.enableGraphCapture),g=[],w=[],$=[],b=[],x=[];for(let I=0;I<m;I++){let[T,C,q]=zr(n,I);T===0&&Y("Can't get an input name."),l.push(T);let D=a.UTF8ToString(T);g.push(D),$.push(C===0?{name:D,isTensor:!1}:{name:D,isTensor:!0,type:Ee(C),shape:q})}for(let I=0;I<y;I++){let[T,C,q]=zr(n,I+m);T===0&&Y("Can't get an output name."),d.push(T);let D=a.UTF8ToString(T);w.push(D),b.push(C===0?{name:D,isTensor:!1}:{name:D,isTensor:!0,type:Ee(C),shape:q});{if(_&&(t==null?void 0:t.preferredOutputLocation)===void 0){x.push("gpu-buffer");continue}let P=typeof(t==null?void 0:t.preferredOutputLocation)=="string"?t.preferredOutputLocation:((c=t==null?void 0:t.preferredOutputLocation)==null?void 0:c[D])??"cpu";if(P!=="cpu"&&P!=="cpu-pinned"&&P!=="gpu-buffer"&&P!=="ml-tensor")throw new Error(`Not supported preferred output location: ${P}.`);if(_&&P!=="gpu-buffer")throw new Error(`Not supported preferred output location: ${P}. Only 'gpu-buffer' location is supported when enableGraphCapture is true.`);x.push(P)}}let v=null;return x.some(I=>I==="gpu-buffer"||I==="ml-tensor")&&(o=a._OrtCreateBinding(n),o===0&&Y("Can't create IO binding."),v={handle:o,outputPreferredLocations:x,outputPreferredLocationsEncoded:x.map(I=>yi(I))}),De.set(n,[n,l,d,v,_,!1]),[n,g,w,$,b]}catch(m){throw l.forEach(y=>a._OrtFree(y)),d.forEach(y=>a._OrtFree(y)),o!==0&&a._OrtReleaseBinding(o)!==0&&Y("Can't release IO binding."),n!==0&&a._OrtReleaseSession(n)!==0&&Y("Can't release session."),m}finally{a._free(i),s!==0&&a._OrtReleaseSessionOptions(s)!==0&&Y("Can't release session options."),u.forEach(m=>a._free(m)),(f=a.unmountExternalData)==null||f.call(a)}},Cr=e=>{var u,l,d;let t=ee(),i=De.get(e);if(!i)throw new Error(`cannot release session. invalid session id: ${e}`);let[r,a,n,s,o]=i;s&&(o&&t._OrtClearBoundOutputs(s.handle)!==0&&Y("Can't clear bound outputs."),t._OrtReleaseBinding(s.handle)!==0&&Y("Can't release IO binding.")),(u=t.jsepOnReleaseSession)==null||u.call(t,e),(l=t.webnnOnReleaseSession)==null||l.call(t,e),(d=t.webgpuOnReleaseSession)==null||d.call(t,e),a.forEach(p=>t._OrtFree(p)),n.forEach(p=>t._OrtFree(p)),t._OrtReleaseSession(r)!==0&&Y("Can't release session."),De.delete(e)},Br=async(e,t,i,r,a,n,s=!1)=>{if(!e){t.push(0);return}let o=ee(),u=o.PTR_SIZE,l=e[0],d=e[1],p=e[3],h=p,c,f;if(l==="string"&&(p==="gpu-buffer"||p==="ml-tensor"))throw new Error("String tensor is not supported on GPU.");if(s&&p!=="gpu-buffer")throw new Error(`External buffer must be provided for input/output index ${n} when enableGraphCapture is true.`);if(p==="gpu-buffer"){let _=e[2].gpuBuffer;f=Ve(et(l),d);{let g=o.jsepRegisterBuffer;if(!g)throw new Error('Tensor location "gpu-buffer" is not supported without using WebGPU.');c=g(r,n,_,f)}}else if(p==="ml-tensor"){let _=e[2].mlTensor;f=Ve(et(l),d);let g=o.webnnRegisterMLTensor;if(!g)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');c=g(r,_,et(l),d)}else{let _=e[2];if(Array.isArray(_)){f=u*_.length,c=o._malloc(f),i.push(c);for(let g=0;g<_.length;g++){if(typeof _[g]!="string")throw new TypeError(`tensor data at index ${g} is not a string`);o.setValue(c+g*u,be(_[g],i),"*")}}else{let g=o.webnnIsGraphInput;if(l!=="string"&&g){let w=o.UTF8ToString(a);if(g(r,w)){let $=et(l);f=Ve($,d),h="ml-tensor";let b=o.webnnCreateTemporaryTensor,x=o.webnnUploadTensor;if(!b||!x)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');let v=await b(r,$,d);x(v,new Uint8Array(_.buffer,_.byteOffset,_.byteLength)),c=v}else f=_.byteLength,c=o._malloc(f),i.push(c),o.HEAPU8.set(new Uint8Array(_.buffer,_.byteOffset,f),c)}else f=_.byteLength,c=o._malloc(f),i.push(c),o.HEAPU8.set(new Uint8Array(_.buffer,_.byteOffset,f),c)}}let m=o.stackSave(),y=o.stackAlloc(4*d.length);try{d.forEach((g,w)=>o.setValue(y+w*u,g,u===4?"i32":"i64"));let _=o._OrtCreateTensor(et(l),c,f,y,d.length,yi(h));_===0&&Y(`Can't create tensor for input/output. session=${r}, index=${n}.`),t.push(_)}finally{o.stackRestore(m)}},Ar=async(e,t,i,r,a,n)=>{var q,D,P,Z;let s=ee(),o=s.PTR_SIZE,u=De.get(e);if(!u)throw new Error(`cannot run inference. invalid session id: ${e}`);let l=u[0],d=u[1],p=u[2],h=u[3],c=u[4],f=u[5],m=t.length,y=r.length,_=0,g=[],w=[],$=[],b=[],x=s.stackSave(),v=s.stackAlloc(m*o),I=s.stackAlloc(m*o),T=s.stackAlloc(y*o),C=s.stackAlloc(y*o);try{[_,g]=ga(n);for(let A=0;A<m;A++)await Br(i[A],w,b,e,d[t[A]],t[A],c);for(let A=0;A<y;A++)await Br(a[A],$,b,e,p[r[A]],m+r[A],c);for(let A=0;A<m;A++)s.setValue(v+A*o,w[A],"*"),s.setValue(I+A*o,d[t[A]],"*");for(let A=0;A<y;A++)s.setValue(T+A*o,$[A],"*"),s.setValue(C+A*o,p[r[A]],"*");if(h&&!f){let{handle:A,outputPreferredLocations:J,outputPreferredLocationsEncoded:G}=h;if(d.length!==m)throw new Error(`input count from feeds (${m}) is expected to be always equal to model's input count (${d.length}).`);for(let j=0;j<m;j++){let z=t[j];await s._OrtBindInput(A,d[z],w[j])!==0&&Y(`Can't bind input[${j}] for session=${e}.`)}for(let j=0;j<y;j++){let z=r[j];(q=a[j])!=null&&q[3]?s._OrtBindOutput(A,p[z],$[j],0)!==0&&Y(`Can't bind pre-allocated output[${j}] for session=${e}.`):s._OrtBindOutput(A,p[z],0,G[z])!==0&&Y(`Can't bind output[${j}] to ${J[j]} for session=${e}.`)}De.set(e,[l,d,p,h,c,!0])}(D=s.jsepOnRunStart)==null||D.call(s,l),(P=s.webnnOnRunStart)==null||P.call(s,l);let H;h?H=await s._OrtRunWithBinding(l,h.handle,y,T,_):H=await s._OrtRun(l,I,v,m,C,y,T,_),H!==0&&Y("failed to call OrtRun().");let U=[];for(let A=0;A<y;A++){let J=Number(s.getValue(T+A*o,"*"));if(J===$[A]){U.push(a[A]);continue}let G=s.stackSave(),j=s.stackAlloc(4*o),z=!1,B,N=0;try{s._OrtGetTensorData(J,j,j+o,j+2*o,j+3*o)!==0&&Y(`Can't access output tensor data on index ${A}.`);let X=o===4?"i32":"i64",pe=Number(s.getValue(j,X));N=s.getValue(j+o,"*");let Kt=s.getValue(j+o*2,"*"),$h=Number(s.getValue(j+o*3,X)),Qe=[];for(let ue=0;ue<$h;ue++)Qe.push(Number(s.getValue(Kt+ue*o,X)));s._OrtFree(Kt)!==0&&Y("Can't free memory for tensor dims.");let Xe=Qe.reduce((ue,ne)=>ue*ne,1);B=Ee(pe);let Zt=h==null?void 0:h.outputPreferredLocations[r[A]];if(B==="string"){if(Zt==="gpu-buffer"||Zt==="ml-tensor")throw new Error("String tensor is not supported on GPU.");let ue=[];for(let ne=0;ne<Xe;ne++){let Ye=s.getValue(N+ne*o,"*"),wh=s.getValue(N+(ne+1)*o,"*"),bh=ne===Xe-1?void 0:wh-Ye;ue.push(s.UTF8ToString(Ye,bh))}U.push([B,Qe,ue,"cpu"])}else if(Zt==="gpu-buffer"&&Xe>0){let ue=s.jsepGetBuffer;if(!ue)throw new Error('preferredLocation "gpu-buffer" is not supported without using WebGPU.');let ne=ue(N),Ye=Ve(pe,Xe);if(Ye===void 0||!gi(B))throw new Error(`Unsupported data type: ${B}`);z=!0,U.push([B,Qe,{gpuBuffer:ne,download:s.jsepCreateDownloader(ne,Ye,B),dispose:()=>{s._OrtReleaseTensor(J)!==0&&Y("Can't release tensor.")}},"gpu-buffer"])}else if(Zt==="ml-tensor"&&Xe>0){let ue=s.webnnEnsureTensor,ne=s.webnnIsInt64Supported;if(!ue||!ne)throw new Error('preferredLocation "ml-tensor" is not supported without using WebNN.');if(Ve(pe,Xe)===void 0||!_i(B))throw new Error(`Unsupported data type: ${B}`);if(B==="int64"&&!ne(e))throw new Error('preferredLocation "ml-tensor" for int64 output is not supported by current WebNN Context.');let Ye=await ue(e,N,pe,Qe,!1);z=!0,U.push([B,Qe,{mlTensor:Ye,download:s.webnnCreateMLTensorDownloader(N,B),dispose:()=>{s.webnnReleaseTensorId(N),s._OrtReleaseTensor(J)}},"ml-tensor"])}else{let ue=mi(B),ne=new ue(Xe);new Uint8Array(ne.buffer,ne.byteOffset,ne.byteLength).set(s.HEAPU8.subarray(N,N+ne.byteLength)),U.push([B,Qe,ne,"cpu"])}}finally{s.stackRestore(G),B==="string"&&N&&s._free(N),z||s._OrtReleaseTensor(J),(Z=s.webnnOnRunEnd)==null||Z.call(s,l)}}return h&&!c&&(s._OrtClearBoundOutputs(h.handle)!==0&&Y("Can't clear bound outputs."),De.set(e,[l,d,p,h,c,!1])),U}finally{s.stackRestore(x),w.forEach(H=>s._OrtReleaseTensor(H)),$.forEach(H=>s._OrtReleaseTensor(H)),b.forEach(H=>s._free(H)),_!==0&&s._OrtReleaseRunOptions(_),g.forEach(H=>s._free(H))}},Or=e=>{let t=ee(),i=De.get(e);if(!i)throw new Error("invalid session id");let r=i[0],a=t._OrtEndProfiling(r);a===0&&Y("Can't get an profile file name."),t._OrtFree(a)},Rr=e=>{let t=[];for(let i of e){let r=i[2];!Array.isArray(r)&&"buffer"in r&&t.push(r.buffer)}return t}}),Me,de,at,xt,kt,Ft,Dr,jt,Ke,Ze,Ud,qd,Nd,Vd,Ld,Wd,Gd,Hd,Fd=E(()=>{we(),Pd(),Ne(),di(),Me=()=>!!te.wasm.proxy&&typeof document<"u",at=!1,xt=!1,kt=!1,jt=new Map,Ke=(e,t)=>{let i=jt.get(e);i?i.push(t):jt.set(e,[t])},Ze=()=>{if(at||!xt||kt||!de)throw new Error("worker not ready")},Ud=e=>{switch(e.data.type){case"init-wasm":at=!1,e.data.err?(kt=!0,Dr[1](e.data.err)):(xt=!0,Dr[0]()),Ft&&(URL.revokeObjectURL(Ft),Ft=void 0);break;case"init-ep":case"copy-from":case"create":case"release":case"run":case"end-profiling":{let t=jt.get(e.data.type);e.data.err?t.shift()[1](e.data.err):t.shift()[0](e.data.out);break}}},qd=async()=>{if(!xt){if(at)throw new Error("multiple calls to 'initWasm()' detected.");if(kt)throw new Error("previous call to 'initWasm()' failed.");if(at=!0,Me())return new Promise((e,t)=>{de==null||de.terminate(),pa().then(([i,r])=>{try{de=r,de.onerror=n=>t(n),de.onmessage=Ud,Dr=[e,t];let a={type:"init-wasm",in:te};if(!a.in.wasm.wasmPaths&&i){let n=si();n&&(a.in.wasm.wasmPaths=n)}de.postMessage(a),Ft=i}catch(a){t(a)}},t)});try{await ci(te.wasm),await Sr(te),xt=!0}catch(e){throw kt=!0,e}finally{at=!1}}},Nd=async e=>{if(Me())return Ze(),new Promise((t,i)=>{Ke("init-ep",[t,i]);let r={type:"init-ep",in:{epName:e,env:te}};de.postMessage(r)});await Tr(te,e)},Vd=async e=>Me()?(Ze(),new Promise((t,i)=>{Ke("copy-from",[t,i]);let r={type:"copy-from",in:{buffer:e}};de.postMessage(r,[e.buffer])})):Ht(e),Ld=async(e,t)=>{if(Me()){if(t!=null&&t.preferredOutputLocation)throw new Error('session option "preferredOutputLocation" is not supported for proxy.');return Ze(),new Promise((i,r)=>{Ke("create",[i,r]);let a={type:"create",in:{model:e,options:{...t}}},n=[];e instanceof Uint8Array&&n.push(e.buffer),de.postMessage(a,n)})}else return Er(e,t)},Wd=async e=>{if(Me())return Ze(),new Promise((t,i)=>{Ke("release",[t,i]);let r={type:"release",in:e};de.postMessage(r)});Cr(e)},Gd=async(e,t,i,r,a,n)=>{if(Me()){if(i.some(s=>s[3]!=="cpu"))throw new Error("input tensor on GPU is not supported for proxy.");if(a.some(s=>s))throw new Error("pre-allocated output tensor is not supported for proxy.");return Ze(),new Promise((s,o)=>{Ke("run",[s,o]);let u=i,l={type:"run",in:{sessionId:e,inputIndices:t,inputs:u,outputIndices:r,options:n}};de.postMessage(l,Rr(u))})}else return Ar(e,t,i,r,a,n)},Hd=async e=>{if(Me())return Ze(),new Promise((t,i)=>{Ke("end-profiling",[t,i]);let r={type:"end-profiling",in:e};de.postMessage(r)});Or(e)}}),Mr,jd,Kd,mh=E(()=>{we(),Fd(),V(),ri(),va(),Mr=(e,t)=>{switch(e.location){case"cpu":return[e.type,e.dims,e.data,"cpu"];case"gpu-buffer":return[e.type,e.dims,{gpuBuffer:e.gpuBuffer},"gpu-buffer"];case"ml-tensor":return[e.type,e.dims,{mlTensor:e.mlTensor},"ml-tensor"];default:throw new Error(`invalid data location: ${e.location} for ${t()}`)}},jd=e=>{switch(e[3]){case"cpu":return new ye(e[0],e[2],e[1]);case"gpu-buffer":{let t=e[0];if(!gi(t))throw new Error(`not supported data type: ${t} for deserializing GPU tensor`);let{gpuBuffer:i,download:r,dispose:a}=e[2];return ye.fromGpuBuffer(i,{dataType:t,dims:e[1],download:r,dispose:a})}case"ml-tensor":{let t=e[0];if(!_i(t))throw new Error(`not supported data type: ${t} for deserializing MLTensor tensor`);let{mlTensor:i,download:r,dispose:a}=e[2];return ye.fromMLTensor(i,{dataType:t,dims:e[1],download:r,dispose:a})}default:throw new Error(`invalid data location: ${e[3]}`)}},Kd=class{async fetchModelAndCopyToWasmMemory(e){return Vd(await $i(e))}async loadModel(e,t){$e();let i;typeof e=="string"?i=await this.fetchModelAndCopyToWasmMemory(e):i=e,[this.sessionId,this.inputNames,this.outputNames,this.inputMetadata,this.outputMetadata]=await Ld(i,t),_e()}async dispose(){return Wd(this.sessionId)}async run(e,t,i){$e();let r=[],a=[];Object.entries(e).forEach(p=>{let h=p[0],c=p[1],f=this.inputNames.indexOf(h);if(f===-1)throw new Error(`invalid input '${h}'`);r.push(c),a.push(f)});let n=[],s=[];Object.entries(t).forEach(p=>{let h=p[0],c=p[1],f=this.outputNames.indexOf(h);if(f===-1)throw new Error(`invalid output '${h}'`);n.push(c),s.push(f)});let o=r.map((p,h)=>Mr(p,()=>`input "${this.inputNames[a[h]]}"`)),u=n.map((p,h)=>p?Mr(p,()=>`output "${this.outputNames[s[h]]}"`):null),l=await Gd(this.sessionId,a,o,s,u,i),d={};for(let p=0;p<l.length;p++)d[this.outputNames[s[p]]]=n[p]??jd(l[p]);return _e(),d}startProfiling(){}endProfiling(){Hd(this.sessionId)}}}),Zd={};Je(Zd,{OnnxruntimeWebAssemblyBackend:()=>Ur,initializeFlags:()=>Pr,wasmBackend:()=>Qd});var Pr,Ur,Qd,gh=E(()=>{we(),Fd(),mh(),Pr=()=>{(typeof te.wasm.initTimeout!="number"||te.wasm.initTimeout<0)&&(te.wasm.initTimeout=0);let e=te.wasm.simd;if(typeof e!="boolean"&&e!==void 0&&e!=="fixed"&&e!=="relaxed"&&(console.warn(`Property "env.wasm.simd" is set to unknown value "${e}". Reset it to \`false\` and ignore SIMD feature checking.`),te.wasm.simd=!1),typeof te.wasm.proxy!="boolean"&&(te.wasm.proxy=!1),typeof te.wasm.trace!="boolean"&&(te.wasm.trace=!1),typeof te.wasm.numThreads!="number"||!Number.isInteger(te.wasm.numThreads)||te.wasm.numThreads<=0)if(typeof self<"u"&&!self.crossOriginIsolated)te.wasm.numThreads=1;else{let t=typeof navigator>"u"?rp("node:os").cpus().length:navigator.hardwareConcurrency;te.wasm.numThreads=Math.min(4,Math.ceil((t||1)/2))}},Ur=class{async init(e){Pr(),await qd(),await Nd(e)}async createInferenceSessionHandler(e,t){let i=new Kd;return await i.loadModel(e,t),i}},Qd=new Ur}),Xd={};Je(Xd,{InferenceSession:()=>ii,TRACE:()=>pt,TRACE_FUNC_BEGIN:()=>$e,TRACE_FUNC_END:()=>_e,Tensor:()=>ye,default:()=>yh,env:()=>te,registerBackend:()=>Ue}),we(),we(),we();var _h="1.22.0-dev.20250409-89f8206ba4",yh=ra;{let e=(gh(),ut(Zd)).wasmBackend;Ue("webgpu",e,5),Ue("webnn",e,5),Ue("cpu",e,10),Ue("wasm",e,10)}return Object.defineProperty(te.versions,"web",{value:_h,enumerable:!0}),ut(Xd)})();/**
 * @license
 * Copyright 2021 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 *//**
 * @license
 * Copyright 2020 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 *//**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */he.exports=st})(Yd);var tp=Yd.exports;const Ih=kh(tp),Th=xh({__proto__:null,default:Ih},[tp]);export{Th as o};
