var za=Object.defineProperty,Tg=Object.getOwnPropertyDescriptor,kg=Object.getOwnPropertyNames,Ig=Object.prototype.hasOwnProperty,Eg=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(t,r)=>(typeof require<"u"?require:t)[r]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')}),P=(e,t)=>()=>(e&&(t=e(e=0)),t),Wt=(e,t)=>{for(var r in t)za(e,r,{get:t[r],enumerable:!0})},zg=(e,t,r,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let a of kg(t))!Ig.call(e,a)&&a!==r&&za(e,a,{get:()=>t[a],enumerable:!(i=Tg(t,a))||i.enumerable});return e},ur=e=>zg(za({},"__esModule",{value:!0}),e),Ft,ct,Dt,Ys,Ad,Od=P(()=>{Ft=new Map,ct=[],Dt=(e,t,r)=>{if(t&&typeof t.init=="function"&&typeof t.createInferenceSessionHandler=="function"){let i=Ft.get(e);if(i===void 0)Ft.set(e,{backend:t,priority:r});else{if(i.priority>r)return;if(i.priority===r&&i.backend!==t)throw new Error(`cannot register backend "${e}" using priority ${r}`)}if(r>=0){let a=ct.indexOf(e);a!==-1&&ct.splice(a,1);for(let n=0;n<ct.length;n++)if(Ft.get(ct[n]).priority<=r){ct.splice(n,0,e);return}ct.push(e)}return}throw new TypeError("not a valid backend")},Ys=async e=>{let t=Ft.get(e);if(!t)return"backend not found.";if(t.initialized)return t.backend;if(t.aborted)return t.error;{let r=!!t.initPromise;try{return r||(t.initPromise=t.backend.init(e)),await t.initPromise,t.initialized=!0,t.backend}catch(i){return r||(t.error=`${i}`,t.aborted=!0),t.error}finally{delete t.initPromise}}},Ad=async e=>{let t=e.executionProviders||[],r=t.map(d=>typeof d=="string"?d:d.name),i=r.length===0?ct:r,a,n=[],s=new Set;for(let d of i){let p=await Ys(d);typeof p=="string"?n.push({name:d,err:p}):(a||(a=p),a===p&&s.add(d))}if(!a)throw new Error(`no available backend found. ERR: ${n.map(d=>`[${d.name}] ${d.err}`).join(", ")}`);for(let{name:d,err:p}of n)r.includes(d)&&console.warn(`removing requested execution provider "${d}" from session options because it is not available: ${p}`);let u=t.filter(d=>s.has(typeof d=="string"?d:d.name));return[a,new Proxy(e,{get:(d,p)=>p==="executionProviders"?u:Reflect.get(d,p)})]}}),Cg=P(()=>{Od()}),Rd,Ag=P(()=>{Rd="1.24.1"}),yi,ke,Bd=P(()=>{Ag(),yi="warning",ke={wasm:{},webgl:{},webgpu:{},versions:{common:Rd},set logLevel(e){if(e!==void 0){if(typeof e!="string"||["verbose","info","warning","error","fatal"].indexOf(e)===-1)throw new Error(`Unsupported logging level: ${e}`);yi=e}},get logLevel(){return yi}},Object.defineProperty(ke,"logLevel",{enumerable:!0})}),we,Og=P(()=>{Bd(),we=ke}),Nd,Md,Rg=P(()=>{Nd=(e,t)=>{let r=typeof document<"u"?document.createElement("canvas"):new OffscreenCanvas(1,1);r.width=e.dims[3],r.height=e.dims[2];let i=r.getContext("2d");if(i!=null){let a,n;t?.tensorLayout!==void 0&&t.tensorLayout==="NHWC"?(a=e.dims[2],n=e.dims[3]):(a=e.dims[3],n=e.dims[2]);let s=t?.format!==void 0?t.format:"RGB",u=t?.norm,d,p;u===void 0||u.mean===void 0?d=[255,255,255,255]:typeof u.mean=="number"?d=[u.mean,u.mean,u.mean,u.mean]:(d=[u.mean[0],u.mean[1],u.mean[2],0],u.mean[3]!==void 0&&(d[3]=u.mean[3])),u===void 0||u.bias===void 0?p=[0,0,0,0]:typeof u.bias=="number"?p=[u.bias,u.bias,u.bias,u.bias]:(p=[u.bias[0],u.bias[1],u.bias[2],0],u.bias[3]!==void 0&&(p[3]=u.bias[3]));let m=n*a,h=0,g=m,y=m*2,_=-1;s==="RGBA"?(h=0,g=m,y=m*2,_=m*3):s==="RGB"?(h=0,g=m,y=m*2):s==="RBG"&&(h=0,y=m,g=m*2);for(let $=0;$<n;$++)for(let T=0;T<a;T++){let x=(e.data[h++]-p[0])*d[0],w=(e.data[g++]-p[1])*d[1],I=(e.data[y++]-p[2])*d[2],S=_===-1?255:(e.data[_++]-p[3])*d[3];i.fillStyle="rgba("+x+","+w+","+I+","+S+")",i.fillRect(T,$,1,1)}if("toDataURL"in r)return r.toDataURL();throw new Error("toDataURL is not supported")}else throw new Error("Can not access image data")},Md=(e,t)=>{let r=typeof document<"u"?document.createElement("canvas").getContext("2d"):new OffscreenCanvas(1,1).getContext("2d"),i;if(r!=null){let a,n,s;t?.tensorLayout!==void 0&&t.tensorLayout==="NHWC"?(a=e.dims[2],n=e.dims[1],s=e.dims[3]):(a=e.dims[3],n=e.dims[2],s=e.dims[1]);let u=t!==void 0&&t.format!==void 0?t.format:"RGB",d=t?.norm,p,m;d===void 0||d.mean===void 0?p=[255,255,255,255]:typeof d.mean=="number"?p=[d.mean,d.mean,d.mean,d.mean]:(p=[d.mean[0],d.mean[1],d.mean[2],255],d.mean[3]!==void 0&&(p[3]=d.mean[3])),d===void 0||d.bias===void 0?m=[0,0,0,0]:typeof d.bias=="number"?m=[d.bias,d.bias,d.bias,d.bias]:(m=[d.bias[0],d.bias[1],d.bias[2],0],d.bias[3]!==void 0&&(m[3]=d.bias[3]));let h=n*a;if(t!==void 0&&(t.format!==void 0&&s===4&&t.format!=="RGBA"||s===3&&t.format!=="RGB"&&t.format!=="BGR"))throw new Error("Tensor format doesn't match input tensor dims");let g=4,y=0,_=1,$=2,T=3,x=0,w=h,I=h*2,S=-1;u==="RGBA"?(x=0,w=h,I=h*2,S=h*3):u==="RGB"?(x=0,w=h,I=h*2):u==="RBG"&&(x=0,I=h,w=h*2),i=r.createImageData(a,n);for(let E=0;E<n*a;y+=g,_+=g,$+=g,T+=g,E++)i.data[y]=(e.data[x++]-m[0])*p[0],i.data[_]=(e.data[w++]-m[1])*p[1],i.data[$]=(e.data[I++]-m[2])*p[2],i.data[T]=S===-1?255:(e.data[S++]-m[3])*p[3]}else throw new Error("Can not access image data");return i}}),xr,Dd,Ud,Pd,qd,Wd,Bg=P(()=>{Ca(),xr=(e,t)=>{if(e===void 0)throw new Error("Image buffer must be defined");if(t.height===void 0||t.width===void 0)throw new Error("Image height and width must be defined");if(t.tensorLayout==="NHWC")throw new Error("NHWC Tensor layout is not supported yet");let{height:r,width:i}=t,a=t.norm??{mean:255,bias:0},n,s;typeof a.mean=="number"?n=[a.mean,a.mean,a.mean,a.mean]:n=[a.mean[0],a.mean[1],a.mean[2],a.mean[3]??255],typeof a.bias=="number"?s=[a.bias,a.bias,a.bias,a.bias]:s=[a.bias[0],a.bias[1],a.bias[2],a.bias[3]??0];let u=t.format!==void 0?t.format:"RGBA",d=t.tensorFormat!==void 0&&t.tensorFormat!==void 0?t.tensorFormat:"RGB",p=r*i,m=d==="RGBA"?new Float32Array(p*4):new Float32Array(p*3),h=4,g=0,y=1,_=2,$=3,T=0,x=p,w=p*2,I=-1;u==="RGB"&&(h=3,g=0,y=1,_=2,$=-1),d==="RGBA"?I=p*3:d==="RBG"?(T=0,w=p,x=p*2):d==="BGR"&&(w=0,x=p,T=p*2);for(let S=0;S<p;S++,g+=h,_+=h,y+=h,$+=h)m[T++]=(e[g]+s[0])/n[0],m[x++]=(e[y]+s[1])/n[1],m[w++]=(e[_]+s[2])/n[2],I!==-1&&$!==-1&&(m[I++]=(e[$]+s[3])/n[3]);return d==="RGBA"?new Be("float32",m,[1,4,r,i]):new Be("float32",m,[1,3,r,i])},Dd=async(e,t)=>{let r=typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement,i=typeof ImageData<"u"&&e instanceof ImageData,a=typeof ImageBitmap<"u"&&e instanceof ImageBitmap,n=typeof e=="string",s,u=t??{},d=()=>{if(typeof document<"u")return document.createElement("canvas");if(typeof OffscreenCanvas<"u")return new OffscreenCanvas(1,1);throw new Error("Canvas is not supported")},p=m=>typeof HTMLCanvasElement<"u"&&m instanceof HTMLCanvasElement||m instanceof OffscreenCanvas?m.getContext("2d"):null;if(r){let m=d();m.width=e.width,m.height=e.height;let h=p(m);if(h!=null){let g=e.height,y=e.width;if(t!==void 0&&t.resizedHeight!==void 0&&t.resizedWidth!==void 0&&(g=t.resizedHeight,y=t.resizedWidth),t!==void 0){if(u=t,t.tensorFormat!==void 0)throw new Error("Image input config format must be RGBA for HTMLImageElement");u.tensorFormat="RGBA",u.height=g,u.width=y}else u.tensorFormat="RGBA",u.height=g,u.width=y;h.drawImage(e,0,0),s=h.getImageData(0,0,y,g).data}else throw new Error("Can not access image data")}else if(i){let m,h;if(t!==void 0&&t.resizedWidth!==void 0&&t.resizedHeight!==void 0?(m=t.resizedHeight,h=t.resizedWidth):(m=e.height,h=e.width),t!==void 0&&(u=t),u.format="RGBA",u.height=m,u.width=h,t!==void 0){let g=d();g.width=h,g.height=m;let y=p(g);if(y!=null)y.putImageData(e,0,0),s=y.getImageData(0,0,h,m).data;else throw new Error("Can not access image data")}else s=e.data}else if(a){if(t===void 0)throw new Error("Please provide image config with format for Imagebitmap");let m=d();m.width=e.width,m.height=e.height;let h=p(m);if(h!=null){let g=e.height,y=e.width;return h.drawImage(e,0,0,y,g),s=h.getImageData(0,0,y,g).data,u.height=g,u.width=y,xr(s,u)}else throw new Error("Can not access image data")}else{if(n)return new Promise((m,h)=>{let g=d(),y=p(g);if(!e||!y)return h();let _=new Image;_.crossOrigin="Anonymous",_.src=e,_.onload=()=>{g.width=_.width,g.height=_.height,y.drawImage(_,0,0,g.width,g.height);let $=y.getImageData(0,0,g.width,g.height);u.height=g.height,u.width=g.width,m(xr($.data,u))}});throw new Error("Input data provided is not supported - aborted tensor creation")}if(s!==void 0)return xr(s,u);throw new Error("Input data provided is not supported - aborted tensor creation")},Ud=(e,t)=>{let{width:r,height:i,download:a,dispose:n}=t,s=[1,i,r,4];return new Be({location:"texture",type:"float32",texture:e,dims:s,download:a,dispose:n})},Pd=(e,t)=>{let{dataType:r,dims:i,download:a,dispose:n}=t;return new Be({location:"gpu-buffer",type:r??"float32",gpuBuffer:e,dims:i,download:a,dispose:n})},qd=(e,t)=>{let{dataType:r,dims:i,download:a,dispose:n}=t;return new Be({location:"ml-tensor",type:r??"float32",mlTensor:e,dims:i,download:a,dispose:n})},Wd=(e,t,r)=>new Be({location:"cpu-pinned",type:e,data:t,dims:r??[t.length]})}),St,ir,_i,Ld,Ng=P(()=>{St=new Map([["float32",Float32Array],["uint8",Uint8Array],["int8",Int8Array],["uint16",Uint16Array],["int16",Int16Array],["int32",Int32Array],["bool",Uint8Array],["float64",Float64Array],["uint32",Uint32Array],["int4",Uint8Array],["uint4",Uint8Array]]),ir=new Map([[Float32Array,"float32"],[Uint8Array,"uint8"],[Int8Array,"int8"],[Uint16Array,"uint16"],[Int16Array,"int16"],[Int32Array,"int32"],[Float64Array,"float64"],[Uint32Array,"uint32"]]),_i=!1,Ld=()=>{if(!_i){_i=!0;let e=typeof BigInt64Array<"u"&&BigInt64Array.from,t=typeof BigUint64Array<"u"&&BigUint64Array.from,r=globalThis.Float16Array,i=typeof r<"u"&&r.from;e&&(St.set("int64",BigInt64Array),ir.set(BigInt64Array,"int64")),t&&(St.set("uint64",BigUint64Array),ir.set(BigUint64Array,"uint64")),i?(St.set("float16",r),ir.set(r,"float16")):St.set("float16",Uint16Array)}}}),Vd,Gd,Mg=P(()=>{Ca(),Vd=e=>{let t=1;for(let r=0;r<e.length;r++){let i=e[r];if(typeof i!="number"||!Number.isSafeInteger(i))throw new TypeError(`dims[${r}] must be an integer, got: ${i}`);if(i<0)throw new RangeError(`dims[${r}] must be a non-negative integer, got: ${i}`);t*=i}return t},Gd=(e,t)=>{switch(e.location){case"cpu":return new Be(e.type,e.data,t);case"cpu-pinned":return new Be({location:"cpu-pinned",data:e.data,type:e.type,dims:t});case"texture":return new Be({location:"texture",texture:e.texture,type:e.type,dims:t});case"gpu-buffer":return new Be({location:"gpu-buffer",gpuBuffer:e.gpuBuffer,type:e.type,dims:t});case"ml-tensor":return new Be({location:"ml-tensor",mlTensor:e.mlTensor,type:e.type,dims:t});default:throw new Error(`tensorReshape: tensor location ${e.location} is not supported`)}}}),Be,Ca=P(()=>{Rg(),Bg(),Ng(),Mg(),Be=class{constructor(e,t,r){Ld();let i,a;if(typeof e=="object"&&"location"in e)switch(this.dataLocation=e.location,i=e.type,a=e.dims,e.location){case"cpu-pinned":{let s=St.get(i);if(!s)throw new TypeError(`unsupported type "${i}" to create tensor from pinned buffer`);if(!(e.data instanceof s))throw new TypeError(`buffer should be of type ${s.name}`);this.cpuData=e.data;break}case"texture":{if(i!=="float32")throw new TypeError(`unsupported type "${i}" to create tensor from texture`);this.gpuTextureData=e.texture,this.downloader=e.download,this.disposer=e.dispose;break}case"gpu-buffer":{if(i!=="float32"&&i!=="float16"&&i!=="int32"&&i!=="int64"&&i!=="uint32"&&i!=="uint8"&&i!=="bool"&&i!=="uint4"&&i!=="int4")throw new TypeError(`unsupported type "${i}" to create tensor from gpu buffer`);this.gpuBufferData=e.gpuBuffer,this.downloader=e.download,this.disposer=e.dispose;break}case"ml-tensor":{if(i!=="float32"&&i!=="float16"&&i!=="int32"&&i!=="int64"&&i!=="uint32"&&i!=="uint64"&&i!=="int8"&&i!=="uint8"&&i!=="bool"&&i!=="uint4"&&i!=="int4")throw new TypeError(`unsupported type "${i}" to create tensor from MLTensor`);this.mlTensorData=e.mlTensor,this.downloader=e.download,this.disposer=e.dispose;break}default:throw new Error(`Tensor constructor: unsupported location '${this.dataLocation}'`)}else{let s,u;if(typeof e=="string")if(i=e,u=r,e==="string"){if(!Array.isArray(t))throw new TypeError("A string tensor's data must be a string array.");s=t}else{let d=St.get(e);if(d===void 0)throw new TypeError(`Unsupported tensor type: ${e}.`);if(Array.isArray(t)){if(e==="float16"&&d===Uint16Array||e==="uint4"||e==="int4")throw new TypeError(`Creating a ${e} tensor from number array is not supported. Please use ${d.name} as data.`);e==="uint64"||e==="int64"?s=d.from(t,BigInt):s=d.from(t)}else if(t instanceof d)s=t;else if(t instanceof Uint8ClampedArray)if(e==="uint8")s=Uint8Array.from(t);else throw new TypeError("A Uint8ClampedArray tensor's data must be type of uint8");else if(e==="float16"&&t instanceof Uint16Array&&d!==Uint16Array)s=new globalThis.Float16Array(t.buffer,t.byteOffset,t.length);else throw new TypeError(`A ${i} tensor's data must be type of ${d}`)}else if(u=t,Array.isArray(e)){if(e.length===0)throw new TypeError("Tensor type cannot be inferred from an empty array.");let d=typeof e[0];if(d==="string")i="string",s=e;else if(d==="boolean")i="bool",s=Uint8Array.from(e);else throw new TypeError(`Invalid element type of data array: ${d}.`)}else if(e instanceof Uint8ClampedArray)i="uint8",s=Uint8Array.from(e);else{let d=ir.get(e.constructor);if(d===void 0)throw new TypeError(`Unsupported type for tensor data: ${e.constructor}.`);i=d,s=e}if(u===void 0)u=[s.length];else if(!Array.isArray(u))throw new TypeError("A tensor's dims must be a number array");a=u,this.cpuData=s,this.dataLocation="cpu"}let n=Vd(a);if(this.cpuData&&n!==this.cpuData.length&&!((i==="uint4"||i==="int4")&&Math.ceil(n/2)===this.cpuData.length))throw new Error(`Tensor's size(${n}) does not match data length(${this.cpuData.length}).`);this.type=i,this.dims=a,this.size=n}static async fromImage(e,t){return Dd(e,t)}static fromTexture(e,t){return Ud(e,t)}static fromGpuBuffer(e,t){return Pd(e,t)}static fromMLTensor(e,t){return qd(e,t)}static fromPinnedBuffer(e,t,r){return Wd(e,t,r)}toDataURL(e){return Nd(this,e)}toImageData(e){return Md(this,e)}get data(){if(this.ensureValid(),!this.cpuData)throw new Error("The data is not on CPU. Use `getData()` to download GPU data to CPU, or use `texture` or `gpuBuffer` property to access the GPU data directly.");return this.cpuData}get location(){return this.dataLocation}get texture(){if(this.ensureValid(),!this.gpuTextureData)throw new Error("The data is not stored as a WebGL texture.");return this.gpuTextureData}get gpuBuffer(){if(this.ensureValid(),!this.gpuBufferData)throw new Error("The data is not stored as a WebGPU buffer.");return this.gpuBufferData}get mlTensor(){if(this.ensureValid(),!this.mlTensorData)throw new Error("The data is not stored as a WebNN MLTensor.");return this.mlTensorData}async getData(e){switch(this.ensureValid(),this.dataLocation){case"cpu":case"cpu-pinned":return this.data;case"texture":case"gpu-buffer":case"ml-tensor":{if(!this.downloader)throw new Error("The current tensor is not created with a specified data downloader.");if(this.isDownloading)throw new Error("The current tensor is being downloaded.");try{this.isDownloading=!0;let t=await this.downloader();return this.downloader=void 0,this.dataLocation="cpu",this.cpuData=t,e&&this.disposer&&(this.disposer(),this.disposer=void 0),t}finally{this.isDownloading=!1}}default:throw new Error(`cannot get data from location: ${this.dataLocation}`)}}dispose(){if(this.isDownloading)throw new Error("The current tensor is being downloaded.");this.disposer&&(this.disposer(),this.disposer=void 0),this.cpuData=void 0,this.gpuTextureData=void 0,this.gpuBufferData=void 0,this.mlTensorData=void 0,this.downloader=void 0,this.isDownloading=void 0,this.dataLocation="none"}ensureValid(){if(this.dataLocation==="none")throw new Error("The tensor is disposed.")}reshape(e){if(this.ensureValid(),this.downloader||this.disposer)throw new Error("Cannot reshape a tensor that owns GPU resource.");return Gd(this,e)}}}),Je,Hd=P(()=>{Ca(),Je=Be}),Ur,wi,et,je,It,Et,Fd=P(()=>{Bd(),Ur=(e,t)=>{(typeof ke.trace>"u"?!ke.wasm.trace:!ke.trace)||console.timeStamp(`${e}::ORT::${t}`)},wi=(e,t)=>{let r=new Error().stack?.split(/\r\n|\r|\n/g)||[],i=!1;for(let a=0;a<r.length;a++){if(i&&!r[a].includes("TRACE_FUNC")){let n=`FUNC_${e}::${r[a].trim().split(" ")[1]}`;t&&(n+=`::${t}`),Ur("CPU",n);return}r[a].includes("TRACE_FUNC")&&(i=!0)}},et=e=>{(typeof ke.trace>"u"?!ke.wasm.trace:!ke.trace)||wi("BEGIN",e)},je=e=>{(typeof ke.trace>"u"?!ke.wasm.trace:!ke.trace)||wi("END",e)},It=e=>{(typeof ke.trace>"u"?!ke.wasm.trace:!ke.trace)||console.time(`ORT::${e}`)},Et=e=>{(typeof ke.trace>"u"?!ke.wasm.trace:!ke.trace)||console.timeEnd(`ORT::${e}`)}}),jd,Dg=P(()=>{Od(),Hd(),Fd(),jd=class Kd{constructor(t){this.handler=t}async run(t,r,i){et(),It("InferenceSession.run");let a={},n={};if(typeof t!="object"||t===null||t instanceof Je||Array.isArray(t))throw new TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");let s=!0;if(typeof r=="object"){if(r===null)throw new TypeError("Unexpected argument[1]: cannot be null.");if(r instanceof Je)throw new TypeError("'fetches' cannot be a Tensor");if(Array.isArray(r)){if(r.length===0)throw new TypeError("'fetches' cannot be an empty array.");s=!1;for(let p of r){if(typeof p!="string")throw new TypeError("'fetches' must be a string array or an object.");if(this.outputNames.indexOf(p)===-1)throw new RangeError(`'fetches' contains invalid output name: ${p}.`);a[p]=null}if(typeof i=="object"&&i!==null)n=i;else if(typeof i<"u")throw new TypeError("'options' must be an object.")}else{let p=!1,m=Object.getOwnPropertyNames(r);for(let h of this.outputNames)if(m.indexOf(h)!==-1){let g=r[h];(g===null||g instanceof Je)&&(p=!0,s=!1,a[h]=g)}if(p){if(typeof i=="object"&&i!==null)n=i;else if(typeof i<"u")throw new TypeError("'options' must be an object.")}else n=r}}else if(typeof r<"u")throw new TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");for(let p of this.inputNames)if(typeof t[p]>"u")throw new Error(`input '${p}' is missing in 'feeds'.`);if(s)for(let p of this.outputNames)a[p]=null;let u=await this.handler.run(t,a,n),d={};for(let p in u)if(Object.hasOwnProperty.call(u,p)){let m=u[p];m instanceof Je?d[p]=m:d[p]=new Je(m.type,m.data,m.dims)}return Et("InferenceSession.run"),je(),d}async release(){return this.handler.dispose()}static async create(t,r,i,a){et(),It("InferenceSession.create");let n,s={};if(typeof t=="string"){if(n=t,typeof r=="object"&&r!==null)s=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof Uint8Array){if(n=t,typeof r=="object"&&r!==null)s=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof ArrayBuffer||typeof SharedArrayBuffer<"u"&&t instanceof SharedArrayBuffer){let m=t,h=0,g=t.byteLength;if(typeof r=="object"&&r!==null)s=r;else if(typeof r=="number"){if(h=r,!Number.isSafeInteger(h))throw new RangeError("'byteOffset' must be an integer.");if(h<0||h>=m.byteLength)throw new RangeError(`'byteOffset' is out of range [0, ${m.byteLength}).`);if(g=t.byteLength-h,typeof i=="number"){if(g=i,!Number.isSafeInteger(g))throw new RangeError("'byteLength' must be an integer.");if(g<=0||h+g>m.byteLength)throw new RangeError(`'byteLength' is out of range (0, ${m.byteLength-h}].`);if(typeof a=="object"&&a!==null)s=a;else if(typeof a<"u")throw new TypeError("'options' must be an object.")}else if(typeof i<"u")throw new TypeError("'byteLength' must be a number.")}else if(typeof r<"u")throw new TypeError("'options' must be an object.");n=new Uint8Array(m,h,g)}else throw new TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");let[u,d]=await Ad(s),p=await u.createInferenceSessionHandler(n,d);return Et("InferenceSession.create"),je(),new Kd(p)}startProfiling(){this.handler.startProfiling()}endProfiling(){this.handler.endProfiling()}get inputNames(){return this.handler.inputNames}get outputNames(){return this.handler.outputNames}get inputMetadata(){return this.handler.inputMetadata}get outputMetadata(){return this.handler.outputMetadata}}}),Qd,Ug=P(()=>{Dg(),Qd=jd}),Pg=P(()=>{}),qg=P(()=>{}),Wg=P(()=>{}),Lg=P(()=>{}),Zd={};Wt(Zd,{InferenceSession:()=>Qd,TRACE:()=>Ur,TRACE_EVENT_BEGIN:()=>It,TRACE_EVENT_END:()=>Et,TRACE_FUNC_BEGIN:()=>et,TRACE_FUNC_END:()=>je,Tensor:()=>Je,env:()=>we,registerBackend:()=>Dt});var Pe=P(()=>{Cg(),Og(),Ug(),Hd(),Pg(),qg(),Fd(),Wg(),Lg()}),Aa=P(()=>{}),Yd={};Wt(Yd,{default:()=>Xd});var bi,$i,Xd,Vg=P(()=>{af(),Ot(),Oa(),bi="ort-wasm-proxy-worker",$i=globalThis.self?.name===bi,$i&&(self.onmessage=e=>{let{type:t,in:r}=e.data;try{switch(t){case"init-wasm":Ra(r.wasm).then(()=>{Za(r).then(()=>{postMessage({type:t})},i=>{postMessage({type:t,err:i})})},i=>{postMessage({type:t,err:i})});break;case"init-ep":{let{epName:i,env:a}=r;Ya(a,i).then(()=>{postMessage({type:t})},n=>{postMessage({type:t,err:n})});break}case"copy-from":{let{buffer:i}=r,a=Hr(i);postMessage({type:t,out:a});break}case"create":{let{model:i,options:a}=r;Xa(i,a).then(n=>{postMessage({type:t,out:n})},n=>{postMessage({type:t,err:n})});break}case"release":Ja(r),postMessage({type:t});break;case"run":{let{sessionId:i,inputIndices:a,inputs:n,outputIndices:s,options:u}=r;en(i,a,n,s,new Array(s.length).fill(null),u).then(d=>{d.some(p=>p[3]!=="cpu")?postMessage({type:t,err:"Proxy does not support non-cpu tensor location."}):postMessage({type:t,out:d},rn([...n,...d]))},d=>{postMessage({type:t,err:d})});break}case"end-profiling":tn(r),postMessage({type:t});break;default:}}catch(i){postMessage({type:t,err:i})}}),Xd=$i?null:e=>new Worker(e??Re,{type:"module",name:bi})}),Jd={};Wt(Jd,{default:()=>ep});async function Xs(e={}){var t=e,r=!!globalThis.window,i=!!globalThis.WorkerGlobalScope,a=i&&self.name?.startsWith("em-pthread");t.mountExternalData=(o,l)=>{o.startsWith("./")&&(o=o.substring(2)),(t.Zc||(t.Zc=new Map)).set(o,l)},t.unmountExternalData=()=>{delete t.Zc},globalThis.SharedArrayBuffer??new WebAssembly.Memory({initial:0,maximum:0,ae:!0}).buffer.constructor;let n=o=>async(...l)=>{try{if(t.$c)throw Error("Session already started");let f=t.$c={Nd:l[0],errors:[]},c=await o(...l);if(t.$c!==f)throw Error("Session mismatch");t.gd?.flush();let b=f.errors;if(0<b.length){let k=await Promise.all(b);if(k=k.filter(z=>z),0<k.length)throw Error(k.join(`
`))}return c}finally{t.$c=null}};t.jsepInit=(o,l)=>{if(o==="webgpu"){[t.gd,t.Dd,t.Hd,t.jd,t.Gd,t.ac,t.Id,t.Kd,t.Ed,t.Fd,t.Jd]=l;let f=t.gd;t.jsepRegisterBuffer=(c,b,k,z)=>f.registerBuffer(c,b,k,z),t.jsepGetBuffer=c=>f.getBuffer(c),t.jsepCreateDownloader=(c,b,k)=>f.createDownloader(c,b,k),t.jsepOnCreateSession=c=>{f.onCreateSession(c)},t.jsepOnReleaseSession=c=>{f.onReleaseSession(c)},t.jsepOnRunStart=c=>f.onRunStart(c),t.Ld=(c,b)=>{f.upload(c,b)}}else if(o==="webnn"){let f=l[0];[t.Zd,t.vd,t.webnnEnsureTensor,t.xd,t.webnnDownloadTensor,t.Yd,t.webnnEnableTraceEvent]=l.slice(1),t.webnnReleaseTensorId=t.vd,t.webnnUploadTensor=t.xd,t.webnnRegisterMLContext=t.Yd,t.webnnOnRunStart=c=>f.onRunStart(c),t.webnnOnRunEnd=f.onRunEnd.bind(f),t.webnnOnReleaseSession=c=>{f.onReleaseSession(c)},t.webnnCreateMLTensorDownloader=(c,b)=>f.createMLTensorDownloader(c,b),t.webnnRegisterMLTensor=(c,b,k,z)=>f.registerMLTensor(c,b,k,z),t.webnnCreateMLContext=c=>f.createMLContext(c),t.webnnRegisterMLConstant=(c,b,k,z,B,W)=>f.registerMLConstant(c,b,k,z,B,t.Zc,W),t.webnnRegisterGraphInput=f.registerGraphInput.bind(f),t.webnnIsGraphInput=f.isGraphInput.bind(f),t.webnnRegisterGraphOutput=f.registerGraphOutput.bind(f),t.webnnIsGraphOutput=f.isGraphOutput.bind(f),t.webnnCreateTemporaryTensor=f.createTemporaryTensor.bind(f),t.webnnIsGraphInputOutputTypeSupported=f.isGraphInputOutputTypeSupported.bind(f)}};let s=()=>{let o=l=>(...f)=>{let c=Ze;return f=l(...f),Ze!=c?new Promise((b,k)=>{ai={resolve:b,reject:k}}):f};(()=>{for(let l of["_OrtAppendExecutionProvider","_OrtCreateSession","_OrtRun","_OrtRunWithBinding","_OrtBindInput"])t[l]=o(t[l])})(),n!==void 0&&(t._OrtRun=n(t._OrtRun),t._OrtRunWithBinding=n(t._OrtRunWithBinding)),s=void 0};t.asyncInit=()=>{s?.()};var u,d,p=(o,l)=>{throw l},m=import.meta.url,h="";if(r||i){try{h=new URL(".",m).href}catch{}i&&(d=o=>{var l=new XMLHttpRequest;return l.open("GET",o,!1),l.responseType="arraybuffer",l.send(null),new Uint8Array(l.response)}),u=async o=>{if(A(o))return new Promise((f,c)=>{var b=new XMLHttpRequest;b.open("GET",o,!0),b.responseType="arraybuffer",b.onload=()=>{b.status==200||b.status==0&&b.response?f(b.response):c(b.status)},b.onerror=c,b.send(null)});var l=await fetch(o,{credentials:"same-origin"});if(l.ok)return l.arrayBuffer();throw Error(l.status+" : "+l.url)}}var g,y,_,$,T,x,w=console.log.bind(console),I=console.error.bind(console),S=w,E=I,C=!1,A=o=>o.startsWith("file://");function v(){ut.buffer!=q.buffer&&L()}if(a){let o=function(l){try{var f=l.data,c=f.Uc;if(c==="load"){let b=[];self.onmessage=k=>b.push(k),x=()=>{postMessage({Uc:"loaded"});for(let k of b)o(k);self.onmessage=o};for(let k of f.Ad)t[k]&&!t[k].proxy||(t[k]=(...z)=>{postMessage({Uc:"callHandler",zd:k,args:z})},k=="print"&&(S=t[k]),k=="printErr"&&(E=t[k]));ut=f.Vd,L(),y=f.Wd,Oe(),vr()}else if(c==="run"){(function(b){var k=(v(),D)[b+52>>>2>>>0];b=(v(),D)[b+56>>>2>>>0],ss(k,k-b),ne(k)})(f.Tc),li(f.Tc,0,0,1,0,0),on(),ti(f.Tc),U||(es(),U=!0);try{gf(f.Pd,f.dd)}catch(b){if(b!="unwind")throw b}}else f.target!=="setimmediate"&&(c==="checkMailbox"?U&&mr():c&&(E(`worker: received unknown command ${c}`),E(f)))}catch(b){throw ts(),b}};var U=!1;self.onunhandledrejection=l=>{throw l.reason||l},self.onmessage=o}var q,Y,H,Q,R,D,G,ee,Z,X,de,M=!1;function L(){var o=ut.buffer;t.HEAP8=q=new Int8Array(o),H=new Int16Array(o),t.HEAPU8=Y=new Uint8Array(o),Q=new Uint16Array(o),t.HEAP32=R=new Int32Array(o),t.HEAPU32=D=new Uint32Array(o),G=new Float32Array(o),ee=new Float64Array(o),Z=new BigInt64Array(o),X=new BigUint64Array(o)}function te(){M=!0,a?x():rt.tb()}function oe(o){throw E(o="Aborted("+o+")"),C=!0,o=new WebAssembly.RuntimeError(o+". Build with -sASSERTIONS for more info."),T?.(o),o}function Ae(){return{a:{ma:Pm,hb:Um,g:yf,J:_f,f:wf,o:bf,h:$f,ha:vf,b:xf,T:Sf,Ia:hn,n:Tf,_:yn,Ya:_n,Ea:wn,Ga:bn,Za:$n,Wa:vn,Pa:xn,Va:Sn,ka:Tn,Fa:kn,Ca:In,Xa:En,Da:zn,cb:kf,ea:If,xa:Ef,va:Cf,da:Of,O:Rf,H:Bf,wa:Nf,Z:Lf,ya:Vf,Sa:Gf,Aa:Ff,Ja:jf,ta:Kf,fa:Qf,Ra:ti,$a:Zf,R:em,s:nm,c:Jr,ib:sm,y:om,M:um,D:lm,m:dm,t:Dn,jb:pm,I:cm,S:hm,j:fm,v:mm,r:gm,l:ym,Ma:_m,Na:wm,Oa:bm,Ka:Wn,La:Ln,ua:Vn,eb:vm,bb:Sm,u:Tm,aa:km,ga:Im,ab:xm,V:Em,_a:zm,Ba:Cm,F:$m,U:Am,la:br,za:Rm,gb:Om,fb:Bm,Ta:jn,Ua:Kn,Ha:Kr,$:Qn,ja:Zn,Qa:Yn,ia:Xn,lb:vg,na:mg,mb:$g,oa:fg,G:ng,d:Vm,q:Wm,w:qm,B:Jm,pb:pg,K:rg,x:Hm,pa:cg,X:gg,ba:dg,nb:bg,ob:wg,ra:sg,qa:lg,qb:og,N:ig,Y:hg,e:Gm,A:Fm,k:Lm,kb:xg,p:Km,z:Qm,C:jm,E:Zm,L:eg,rb:ag,Q:yg,ca:tg,W:_g,sb:Xm,sa:Ym,P:ug,i:Mm,a:ut,db:jr}}}async function Oe(){function o(c,b){var k=rt=c.exports;c={};for(let[z,B]of Object.entries(k))typeof B=="function"?(k=Yf(B),c[z]=k):c[z]=B;return rt=c,rt=(function(){var z=rt,B=V=>ae=>V(ae)>>>0,W=V=>()=>V()>>>0;return(z=Object.assign({},z)).ub=B(z.ub),z.Yb=W(z.Yb),z._b=B(z._b),z.mc=B(z.mc),z.nc=W(z.nc),z.rc=B(z.rc),z})(),nn.push(rt.$b),Jn=(c=rt).ub,es=c.vb,t._OrtInit=c.wb,t._OrtGetLastError=c.xb,t._OrtCreateSessionOptions=c.yb,t._OrtAppendExecutionProvider=c.zb,t._OrtAddFreeDimensionOverride=c.Ab,t._OrtAddSessionConfigEntry=c.Bb,t._OrtReleaseSessionOptions=c.Cb,t._OrtCreateSession=c.Db,t._OrtReleaseSession=c.Eb,t._OrtGetInputOutputCount=c.Fb,t._OrtGetInputOutputMetadata=c.Gb,t._OrtFree=c.Hb,t._OrtCreateTensor=c.Ib,t._OrtGetTensorData=c.Jb,t._OrtReleaseTensor=c.Kb,t._OrtCreateRunOptions=c.Lb,t._OrtAddRunConfigEntry=c.Mb,t._OrtReleaseRunOptions=c.Nb,t._OrtCreateBinding=c.Ob,t._OrtBindInput=c.Pb,t._OrtBindOutput=c.Qb,t._OrtClearBoundOutputs=c.Rb,t._OrtReleaseBinding=c.Sb,t._OrtRunWithBinding=c.Tb,t._OrtRun=c.Ub,t._OrtEndProfiling=c.Vb,t._JsepOutput=c.Wb,t._JsepGetNodeName=c.Xb,$r=c.Yb,Ye=t._free=c.Zb,Gt=t._malloc=c._b,li=c.bc,ts=c.cc,rs=c.dc,is=c.ec,di=c.fc,as=c.gc,ns=c.hc,ue=c.ic,Ht=c.jc,ss=c.kc,ne=c.lc,pi=c.mc,se=c.nc,os=c.oc,ci=c.pc,us=c.qc,ls=c.rc,ds=c.sc,hi=c.tc,ps=c.uc,cs=c.vc,hs=c.wc,fs=c.xc,ms=c.yc,gs=c.zc,ys=c.Ac,_s=c.Bc,ws=c.Cc,bs=c.Dc,$s=c.Ec,vs=c.Fc,xs=c.Gc,Ss=c.Hc,Ts=c.Ic,ks=c.Jc,Is=c.Kc,Es=c.Lc,zs=c.Mc,Cs=c.Nc,As=c.Oc,Os=c.Pc,Rs=c.Rc,Bs=c.Sc,Ns=c.bd,Ms=c.cd,Ds=c.hd,Us=c.kd,Ps=c.ld,qs=c.md,Ws=c.nd,Ls=c.od,Vs=c.pd,Gs=c.qd,Hs=c.rd,Fs=c.wd,js=c.Rd,Ks=c.Sd,Qs=c.Td,Zs=c.Ud,y=b,rt}var l,f=Ae();return t.instantiateWasm?new Promise(c=>{t.instantiateWasm(f,(b,k)=>{c(o(b,k))})}):a?o(new WebAssembly.Instance(y,Ae()),y):(de??=t.locateFile?t.locateFile?t.locateFile("ort-wasm-simd-threaded.jsep.wasm",h):h+"ort-wasm-simd-threaded.jsep.wasm":new URL("/assets/ort-wasm-simd-threaded.jsep-6MnTkKum.wasm",import.meta.url).href,l=await(async function(c){var b=de;if(!g&&!A(b))try{var k=fetch(b,{credentials:"same-origin"});return await WebAssembly.instantiateStreaming(k,c)}catch(z){E(`wasm streaming compile failed: ${z}`),E("falling back to ArrayBuffer instantiation")}return(async function(z,B){try{var W=await(async function(V){if(!g)try{var ae=await u(V);return new Uint8Array(ae)}catch{}if(V==de&&g)V=new Uint8Array(g);else{if(!d)throw"both async and sync fetching of the wasm failed";V=d(V)}return V})(z);return await WebAssembly.instantiate(W,B)}catch(V){E(`failed to asynchronously prepare wasm: ${V}`),oe(V)}})(b,c)})(f),o(l.instance,l.module))}class Me{name="ExitStatus";constructor(l){this.message=`Program terminated with exit(${l})`,this.status=l}}var st=o=>{o.terminate(),o.onmessage=()=>{}},xe=[],_e=0,ze=null,dr=o=>{ot.length==0&&(ln(),un(ot[0]));var l=ot.pop();if(!l)return 6;Lt.push(l),yt[o.Tc]=l,l.Tc=o.Tc;var f={Uc:"run",Pd:o.Od,dd:o.dd,Tc:o.Tc};return l.postMessage(f,o.ud),0},Ke=0,be=(o,l,...f)=>{var c,b=16*f.length,k=se(),z=pi(b),B=z>>>3;for(c of f)typeof c=="bigint"?((v(),Z)[B++>>>0]=1n,(v(),Z)[B++>>>0]=c):((v(),Z)[B++>>>0]=0n,(v(),ee)[B++>>>0]=c);return o=rs(o,0,b,z,l),ne(k),o};function jr(o){if(a)return be(0,1,o);if(_=o,!(0<Ke)){for(var l of Lt)st(l);for(l of ot)st(l);ot=[],Lt=[],yt={},C=!0}p(0,new Me(o))}function an(o){if(a)return be(1,0,o);Kr(o)}var Kr=o=>{if(_=o,a)throw an(o),"unwind";jr(o)},ot=[],Lt=[],nn=[],yt={},sn=o=>{var l=o.Tc;delete yt[l],ot.push(o),Lt.splice(Lt.indexOf(o),1),o.Tc=0,is(l)};function on(){nn.forEach(o=>o())}var un=o=>new Promise(l=>{o.onmessage=b=>{var k=b.data;if(b=k.Uc,k.ad&&k.ad!=$r()){var z=yt[k.ad];z?z.postMessage(k,k.ud):E(`Internal error! Worker sent a message "${b}" to target pthread ${k.ad}, but that thread no longer exists!`)}else b==="checkMailbox"?mr():b==="spawnThread"?dr(k):b==="cleanupThread"?fr(()=>{sn(yt[k.Qd])}):b==="loaded"?(o.loaded=!0,l(o)):k.target==="setimmediate"?o.postMessage(k):b==="uncaughtException"?o.onerror(k.error):b==="callHandler"?t[k.zd](...k.args):b&&E(`worker sent an unknown command ${b}`)},o.onerror=b=>{throw E(`worker sent an error! ${b.filename}:${b.lineno}: ${b.message}`),b};var f,c=[];for(f of[])t.propertyIsEnumerable(f)&&c.push(f);o.postMessage({Uc:"load",Ad:c,Vd:ut,Wd:y})});function ln(){var o=new Worker((()=>{let l=URL;return import.meta.url>"file:"&&import.meta.url<"file;"?new l("ort.bundle.min.mjs",import.meta.url):new URL(import.meta.url)})(),{type:"module",workerData:"em-pthread",name:"em-pthread"});ot.push(o)}var ut,gf=(o,l)=>{Ke=0,o=hi(o,l),0<Ke?_=o:di(o)},pr=[],cr=0;function yf(o){var l=new Qr(o>>>=0);return(v(),q)[l.Vc+12>>>0]==0&&(dn(l,!0),cr--),pn(l,!1),pr.push(l),ls(o)}var Bt=0,_f=()=>{ue(0,0);var o=pr.pop();os(o.ed),Bt=0};function dn(o,l){l=l?1:0,(v(),q)[o.Vc+12>>>0]=l}function pn(o,l){l=l?1:0,(v(),q)[o.Vc+13>>>0]=l}class Qr{constructor(l){this.ed=l,this.Vc=l-24}}var Zr=o=>{var l=Bt;if(!l)return Ht(0),0;var f=new Qr(l);(v(),D)[f.Vc+16>>>2>>>0]=l;var c=(v(),D)[f.Vc+4>>>2>>>0];if(!c)return Ht(0),l;for(var b of o){if(b===0||b===c)break;if(us(b,c,f.Vc+16))return Ht(b),l}return Ht(c),l};function wf(){return Zr([])}function bf(o){return Zr([o>>>0])}function $f(o,l,f,c){return Zr([o>>>0,l>>>0,f>>>0,c>>>0])}var vf=()=>{var o=pr.pop();o||oe("no exception to throw");var l=o.ed;throw(v(),q)[o.Vc+13>>>0]==0&&(pr.push(o),pn(o,!0),dn(o,!1),cr++),ci(l),Bt=l};function xf(o,l,f){var c=new Qr(o>>>=0);throw l>>>=0,f>>>=0,(v(),D)[c.Vc+16>>>2>>>0]=0,(v(),D)[c.Vc+4>>>2>>>0]=l,(v(),D)[c.Vc+8>>>2>>>0]=f,ci(o),cr++,Bt=o}var Sf=()=>cr;function cn(o,l,f,c){return a?be(2,1,o,l,f,c):hn(o,l,f,c)}function hn(o,l,f,c){if(o>>>=0,l>>>=0,f>>>=0,c>>>=0,!globalThis.SharedArrayBuffer)return 6;var b=[];return a&&b.length===0?cn(o,l,f,c):(o={Od:f,Tc:o,dd:c,ud:b},a?(o.Uc="spawnThread",postMessage(o,b),0):dr(o))}function Tf(o){throw Bt||=o>>>0,Bt}var fn=globalThis.TextDecoder&&new TextDecoder,mn=(o,l,f,c)=>{if(f=l+f,c)return f;for(;o[l]&&!(l>=f);)++l;return l},gn=(o,l=0,f,c)=>{if(16<(f=mn(o,l>>>=0,f,c))-l&&o.buffer&&fn)return fn.decode(o.buffer instanceof ArrayBuffer?o.subarray(l,f):o.slice(l,f));for(c="";l<f;){var b=o[l++];if(128&b){var k=63&o[l++];if((224&b)==192)c+=String.fromCharCode((31&b)<<6|k);else{var z=63&o[l++];65536>(b=(240&b)==224?(15&b)<<12|k<<6|z:(7&b)<<18|k<<12|z<<6|63&o[l++])?c+=String.fromCharCode(b):(b-=65536,c+=String.fromCharCode(55296|b>>10,56320|1023&b))}}else c+=String.fromCharCode(b)}return c},Se=(o,l,f)=>(o>>>=0)?gn((v(),Y),o,l,f):"";function yn(o,l,f){return a?be(3,1,o,l,f):0}function _n(o,l){if(a)return be(4,1,o,l)}function wn(o,l){if(a)return be(5,1,o,l)}function bn(o,l,f){if(a)return be(6,1,o,l,f)}function $n(o,l,f){return a?be(7,1,o,l,f):0}function vn(o,l){if(a)return be(8,1,o,l)}function xn(o,l,f){if(a)return be(9,1,o,l,f)}function Sn(o,l,f,c){if(a)return be(10,1,o,l,f,c)}function Tn(o,l,f,c){if(a)return be(11,1,o,l,f,c)}function kn(o,l,f,c){if(a)return be(12,1,o,l,f,c)}function In(o){if(a)return be(13,1,o)}function En(o,l){if(a)return be(14,1,o,l)}function zn(o,l,f){if(a)return be(15,1,o,l,f)}var kf=()=>oe(""),Qe=o=>{o>>>=0;for(var l="";;){var f=(v(),Y)[o++>>>0];if(!f)return l;l+=String.fromCharCode(f)}},Yr={},Xr={},Nt=class extends Error{constructor(o){super(o),this.name="BindingError"}};function tt(o,l,f={}){return(function(c,b,k={}){var z=b.name;if(!c)throw new Nt(`type "${z}" must have a positive integer typeid pointer`);if(Xr.hasOwnProperty(c)){if(k.Bd)return;throw new Nt(`Cannot register type '${z}' twice`)}Xr[c]=b,Yr.hasOwnProperty(c)&&(b=Yr[c],delete Yr[c],b.forEach(B=>B()))})(o,l,f)}var Cn=(o,l,f)=>{switch(l){case 1:return f?c=>(v(),q)[c>>>0]:c=>(v(),Y)[c>>>0];case 2:return f?c=>(v(),H)[c>>>1>>>0]:c=>(v(),Q)[c>>>1>>>0];case 4:return f?c=>(v(),R)[c>>>2>>>0]:c=>(v(),D)[c>>>2>>>0];case 8:return f?c=>(v(),Z)[c>>>3>>>0]:c=>(v(),X)[c>>>3>>>0];default:throw new TypeError(`invalid integer width (${l}): ${o}`)}};function If(o,l,f,c,b){o>>>=0,f>>>=0,l=Qe(l>>>0);let k=z=>z;if(c=c===0n){let z=8*f;k=B=>BigInt.asUintN(z,B),b=k(b)}tt(o,{name:l,Qc:k,Xc:(z,B)=>(typeof B=="number"&&(B=BigInt(B)),B),Wc:Cn(l,f,!c),Yc:null})}function Ef(o,l,f,c){tt(o>>>=0,{name:l=Qe(l>>>0),Qc:function(b){return!!b},Xc:function(b,k){return k?f:c},Wc:function(b){return this.Qc((v(),Y)[b>>>0])},Yc:null})}var An=[],_t=[0,1,,1,null,1,!0,1,!1,1];function Jr(o){9<(o>>>=0)&&--_t[o+1]==0&&(_t[o]=void 0,An.push(o))}var De=o=>{if(!o)throw new Nt(`Cannot use deleted val. handle = ${o}`);return _t[o]},qe=o=>{switch(o){case void 0:return 2;case null:return 4;case!0:return 6;case!1:return 8;default:let l=An.pop()||_t.length;return _t[l]=o,_t[l+1]=1,l}};function ei(o){return this.Qc((v(),D)[o>>>2>>>0])}var zf={name:"emscripten::val",Qc:o=>{var l=De(o);return Jr(o),l},Xc:(o,l)=>qe(l),Wc:ei,Yc:null};function Cf(o){return tt(o>>>0,zf)}var Af=(o,l)=>{switch(l){case 4:return function(f){return this.Qc((v(),G)[f>>>2>>>0])};case 8:return function(f){return this.Qc((v(),ee)[f>>>3>>>0])};default:throw new TypeError(`invalid float width (${l}): ${o}`)}};function Of(o,l,f){f>>>=0,tt(o>>>=0,{name:l=Qe(l>>>0),Qc:c=>c,Xc:(c,b)=>b,Wc:Af(l,f),Yc:null})}function Rf(o,l,f,c,b){o>>>=0,f>>>=0,l=Qe(l>>>0);let k=B=>B;if(c===0){var z=32-8*f;k=B=>B<<z>>>z,b=k(b)}tt(o,{name:l,Qc:k,Xc:(B,W)=>W,Wc:Cn(l,f,c!==0),Yc:null})}function Bf(o,l,f){function c(k){var z=(v(),D)[k>>>2>>>0];return k=(v(),D)[k+4>>>2>>>0],new b((v(),q).buffer,k,z)}var b=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array,BigInt64Array,BigUint64Array][l];tt(o>>>=0,{name:f=Qe(f>>>0),Qc:c,Wc:c},{Bd:!0})}var lt=(o,l,f)=>{var c=(v(),Y);if(l>>>=0,0<f){var b=l;f=l+f-1;for(var k=0;k<o.length;++k){var z=o.codePointAt(k);if(127>=z){if(l>=f)break;c[l++>>>0]=z}else if(2047>=z){if(l+1>=f)break;c[l++>>>0]=192|z>>6,c[l++>>>0]=128|63&z}else if(65535>=z){if(l+2>=f)break;c[l++>>>0]=224|z>>12,c[l++>>>0]=128|z>>6&63,c[l++>>>0]=128|63&z}else{if(l+3>=f)break;c[l++>>>0]=240|z>>18,c[l++>>>0]=128|z>>12&63,c[l++>>>0]=128|z>>6&63,c[l++>>>0]=128|63&z,k++}}c[l>>>0]=0,o=l-b}else o=0;return o},hr=o=>{for(var l=0,f=0;f<o.length;++f){var c=o.charCodeAt(f);127>=c?l++:2047>=c?l+=2:55296<=c&&57343>=c?(l+=4,++f):l+=3}return l};function Nf(o,l){tt(o>>>=0,{name:l=Qe(l>>>0),Qc(f){var c=(v(),D)[f>>>2>>>0];return c=Se(f+4,c,!0),Ye(f),c},Xc(f,c){c instanceof ArrayBuffer&&(c=new Uint8Array(c));var b=typeof c=="string";if(!(b||ArrayBuffer.isView(c)&&c.BYTES_PER_ELEMENT==1))throw new Nt("Cannot pass non-string to std::string");var k=b?hr(c):c.length,z=Gt(4+k+1),B=z+4;return(v(),D)[z>>>2>>>0]=k,b?lt(c,B,k+1):(v(),Y).set(c,B>>>0),f!==null&&f.push(Ye,z),z},Wc:ei,Yc(f){Ye(f)}})}var On=globalThis.TextDecoder?new TextDecoder("utf-16le"):void 0,Mf=(o,l,f)=>{if(o>>>=1,16<(l=mn((v(),Q),o,l/2,f))-o&&On)return On.decode((v(),Q).slice(o,l));for(f="";o<l;++o){var c=(v(),Q)[o>>>0];f+=String.fromCharCode(c)}return f},Df=(o,l,f)=>{if(f??=2147483647,2>f)return 0;var c=l;f=(f-=2)<2*o.length?f/2:o.length;for(var b=0;b<f;++b){var k=o.charCodeAt(b);(v(),H)[l>>>1>>>0]=k,l+=2}return(v(),H)[l>>>1>>>0]=0,l-c},Uf=o=>2*o.length,Pf=(o,l,f)=>{var c="";o>>>=2;for(var b=0;!(b>=l/4);b++){var k=(v(),D)[o+b>>>0];if(!k&&!f)break;c+=String.fromCodePoint(k)}return c},qf=(o,l,f)=>{if(l>>>=0,f??=2147483647,4>f)return 0;var c=l;f=c+f-4;for(var b=0;b<o.length;++b){var k=o.codePointAt(b);if(65535<k&&b++,(v(),R)[l>>>2>>>0]=k,(l+=4)+4>f)break}return(v(),R)[l>>>2>>>0]=0,l-c},Wf=o=>{for(var l=0,f=0;f<o.length;++f)65535<o.codePointAt(f)&&f++,l+=4;return l};function Lf(o,l,f){if(o>>>=0,l>>>=0,f=Qe(f>>>=0),l===2)var c=Mf,b=Df,k=Uf;else c=Pf,b=qf,k=Wf;tt(o,{name:f,Qc:z=>{var B=(v(),D)[z>>>2>>>0];return B=c(z+4,B*l,!0),Ye(z),B},Xc:(z,B)=>{if(typeof B!="string")throw new Nt(`Cannot pass non-string to C++ string type ${f}`);var W=k(B),V=Gt(4+W+l);return(v(),D)[V>>>2>>>0]=W/l,b(B,V+4,W+l),z!==null&&z.push(Ye,V),V},Wc:ei,Yc(z){Ye(z)}})}function Vf(o,l){tt(o>>>=0,{Cd:!0,name:l=Qe(l>>>0),Qc:()=>{},Xc:()=>{}})}function Gf(o){li(o>>>0,!i,1,!r,131072,!1),on()}var fr=o=>{if(!C)try{if(o(),!(0<Ke))try{a?$r()&&di(_):Kr(_)}catch(l){l instanceof Me||l=="unwind"||p(0,l)}}catch(l){l instanceof Me||l=="unwind"||p(0,l)}},Hf=!Atomics.waitAsync||globalThis.navigator?.userAgent&&91>Number((navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)||[])[2]);function ti(o){o>>>=0,Hf||(Atomics.waitAsync((v(),R),o>>>2,o).value.then(mr),o+=128,Atomics.store((v(),R),o>>>2,1))}var mr=()=>fr(()=>{var o=$r();o&&(ti(o),ns())});function Ff(o,l){(o>>>=0)==l>>>0?setTimeout(mr):a?postMessage({ad:o,Uc:"checkMailbox"}):(o=yt[o])&&o.postMessage({Uc:"checkMailbox"})}var ri=[];function jf(o,l,f,c,b){for(l>>>=0,b>>>=0,ri.length=0,f=b>>>3,c=b+c>>>3;f<c;){var k;k=(v(),Z)[f++>>>0]?(v(),Z)[f++>>>0]:(v(),ee)[f++>>>0],ri.push(k)}return(l?fi[l]:Dm[o])(...ri)}var Kf=()=>{Ke=0};function Qf(o){o>>>=0,a?postMessage({Uc:"cleanupThread",Qd:o}):sn(yt[o])}function Zf(o){}var gr=o=>{try{o()}catch(l){oe(l)}};function Yf(o){var l=(...f)=>{yr.push(o);try{return o(...f)}finally{C||(yr.pop(),Ze&&dt===1&&yr.length===0&&(dt=0,Ke+=1,gr(Ks),typeof Fibers<"u"&&Fibers.ce()))}};return Nn.set(o,l),l}var dt=0,Ze=null,Rn=0,yr=[],ii=new Map,Bn=new Map,Nn=new Map,Xf=0,ai=null,Jf=[],Mn=o=>(function(l){if(!C){if(dt===0){var f=!1,c=!1;l((b=0)=>{if(!C&&(Rn=b,f=!0,c)){dt=2,gr(()=>Qs(Ze)),typeof MainLoop<"u"&&MainLoop.yd&&MainLoop.resume(),b=!1;try{var k=(function(){var W=(v(),R)[Ze+8>>>2>>>0];return W=Bn.get(W),W=Nn.get(W),--Ke,W()})()}catch(W){k=W,b=!0}var z=!1;if(!Ze){var B=ai;B&&(ai=null,(b?B.reject:B.resolve)(k),z=!0)}if(b&&!z)throw k}}),c=!0,f||(dt=1,Ze=(function(){var b=Gt(65548),k=b+12;if((v(),D)[b>>>2>>>0]=k,(v(),D)[b+4>>>2>>>0]=k+65536,k=yr[0],!ii.has(k)){var z=Xf++;ii.set(k,z),Bn.set(z,k)}return k=ii.get(k),(v(),R)[b+8>>>2>>>0]=k,b})(),typeof MainLoop<"u"&&MainLoop.yd&&MainLoop.pause(),gr(()=>js(Ze)))}else dt===2?(dt=0,gr(Zs),Ye(Ze),Ze=null,Jf.forEach(fr)):oe(`invalid state: ${dt}`);return Rn}})(l=>{o().then(l)});function em(o){return o>>>=0,Mn(async()=>{var l=await De(o);return qe(l)})}var ni=[],tm=o=>{var l=ni.length;return ni.push(o),l},rm=(o,l)=>{for(var f=Array(o),c=0;c<o;++c){var b=c,k=(v(),D)[l+4*c>>>2>>>0],z=Xr[k];if(z===void 0)throw o=`parameter ${c}`,k=Jn(k),l=Qe(k),Ye(k),new Nt(`${o} has unknown type ${l}`);f[b]=z}return f},im=(o,l,f)=>{var c=[];return o=o(c,f),c.length&&((v(),D)[l>>>2>>>0]=qe(c)),o},am={},_r=o=>{var l=am[o];return l===void 0?Qe(o):l};function nm(o,l,f){var[c,...b]=rm(o,l>>>0);l=c.Xc.bind(c);var k=b.map(W=>W.Wc.bind(W));o--;var z={toValue:De};switch(o=k.map((W,V)=>{var ae=`argFromPtr${V}`;return z[ae]=W,`${ae}(args${V?"+"+8*V:""})`}),f){case 0:var B="toValue(handle)";break;case 2:B="new (toValue(handle))";break;case 3:B="";break;case 1:z.getStringOrSymbol=_r,B="toValue(handle)[getStringOrSymbol(methodName)]"}return B+=`(${o})`,c.Cd||(z.toReturnWire=l,z.emval_returnValue=im,B=`return emval_returnValue(toReturnWire, destructorsRef, ${B})`),B=`return function (handle, methodName, destructorsRef, args) {
  ${B}
  }`,f=new Function(Object.keys(z),B)(...Object.values(z)),B=`methodCaller<(${b.map(W=>W.name)}) => ${c.name}>`,tm(Object.defineProperty(f,"name",{value:B}))}function sm(o,l){return l>>>=0,(o=De(o>>>0))==De(l)}function om(o){return(o>>>=0)?(o=_r(o),qe(globalThis[o])):qe(globalThis)}function um(o){return o=_r(o>>>0),qe(t[o])}function lm(o,l){return l>>>=0,o=De(o>>>0),l=De(l),qe(o[l])}function dm(o){9<(o>>>=0)&&(_t[o+1]+=1)}function Dn(o,l,f,c,b){return ni[o>>>0](l>>>0,f>>>0,c>>>0,b>>>0)}function pm(o,l,f,c,b){return Dn(o>>>0,l>>>0,f>>>0,c>>>0,b>>>0)}function cm(){return qe([])}function hm(o){o=De(o>>>0);for(var l=Array(o.length),f=0;f<o.length;f++)l[f]=o[f];return qe(l)}function fm(o){return qe(_r(o>>>0))}function mm(){return qe({})}function gm(o){for(var l=De(o>>>=0);l.length;){var f=l.pop();l.pop()(f)}Jr(o)}function ym(o,l,f){l>>>=0,f>>>=0,o=De(o>>>0),l=De(l),f=De(f),o[l]=f}function _m(o,l){o=-9007199254740992>o||9007199254740992<o?NaN:Number(o),l>>>=0,o=new Date(1e3*o),(v(),R)[l>>>2>>>0]=o.getUTCSeconds(),(v(),R)[l+4>>>2>>>0]=o.getUTCMinutes(),(v(),R)[l+8>>>2>>>0]=o.getUTCHours(),(v(),R)[l+12>>>2>>>0]=o.getUTCDate(),(v(),R)[l+16>>>2>>>0]=o.getUTCMonth(),(v(),R)[l+20>>>2>>>0]=o.getUTCFullYear()-1900,(v(),R)[l+24>>>2>>>0]=o.getUTCDay(),o=(o.getTime()-Date.UTC(o.getUTCFullYear(),0,1,0,0,0,0))/864e5|0,(v(),R)[l+28>>>2>>>0]=o}var Un=o=>o%4==0&&(o%100!=0||o%400==0),Pn=[0,31,60,91,121,152,182,213,244,274,305,335],qn=[0,31,59,90,120,151,181,212,243,273,304,334];function wm(o,l){o=-9007199254740992>o||9007199254740992<o?NaN:Number(o),l>>>=0,o=new Date(1e3*o),(v(),R)[l>>>2>>>0]=o.getSeconds(),(v(),R)[l+4>>>2>>>0]=o.getMinutes(),(v(),R)[l+8>>>2>>>0]=o.getHours(),(v(),R)[l+12>>>2>>>0]=o.getDate(),(v(),R)[l+16>>>2>>>0]=o.getMonth(),(v(),R)[l+20>>>2>>>0]=o.getFullYear()-1900,(v(),R)[l+24>>>2>>>0]=o.getDay();var f=(Un(o.getFullYear())?Pn:qn)[o.getMonth()]+o.getDate()-1|0;(v(),R)[l+28>>>2>>>0]=f,(v(),R)[l+36>>>2>>>0]=-60*o.getTimezoneOffset(),f=new Date(o.getFullYear(),6,1).getTimezoneOffset();var c=new Date(o.getFullYear(),0,1).getTimezoneOffset();o=0|(f!=c&&o.getTimezoneOffset()==Math.min(c,f)),(v(),R)[l+32>>>2>>>0]=o}function bm(o){o>>>=0;var l=new Date((v(),R)[o+20>>>2>>>0]+1900,(v(),R)[o+16>>>2>>>0],(v(),R)[o+12>>>2>>>0],(v(),R)[o+8>>>2>>>0],(v(),R)[o+4>>>2>>>0],(v(),R)[o>>>2>>>0],0),f=(v(),R)[o+32>>>2>>>0],c=l.getTimezoneOffset(),b=new Date(l.getFullYear(),6,1).getTimezoneOffset(),k=new Date(l.getFullYear(),0,1).getTimezoneOffset(),z=Math.min(k,b);return 0>f?(v(),R)[o+32>>>2>>>0]=+(b!=k&&z==c):0<f!=(z==c)&&(b=Math.max(k,b),l.setTime(l.getTime()+6e4*((0<f?z:b)-c))),(v(),R)[o+24>>>2>>>0]=l.getDay(),f=(Un(l.getFullYear())?Pn:qn)[l.getMonth()]+l.getDate()-1|0,(v(),R)[o+28>>>2>>>0]=f,(v(),R)[o>>>2>>>0]=l.getSeconds(),(v(),R)[o+4>>>2>>>0]=l.getMinutes(),(v(),R)[o+8>>>2>>>0]=l.getHours(),(v(),R)[o+12>>>2>>>0]=l.getDate(),(v(),R)[o+16>>>2>>>0]=l.getMonth(),(v(),R)[o+20>>>2>>>0]=l.getYear(),o=l.getTime(),BigInt(isNaN(o)?-1:o/1e3)}function Wn(o,l,f,c,b,k,z){return a?be(16,1,o,l,f,c,b,k,z):-52}function Ln(o,l,f,c,b,k){if(a)return be(17,1,o,l,f,c,b,k)}var Vt={},$m=()=>performance.timeOrigin+performance.now();function Vn(o,l){if(a)return be(18,1,o,l);if(Vt[o]&&(clearTimeout(Vt[o].id),delete Vt[o]),!l)return 0;var f=setTimeout(()=>{delete Vt[o],fr(()=>as(o,performance.timeOrigin+performance.now()))},l);return Vt[o]={id:f,be:l},0}function vm(o,l,f,c){o>>>=0,l>>>=0,f>>>=0,c>>>=0;var b=new Date().getFullYear(),k=new Date(b,0,1).getTimezoneOffset();b=new Date(b,6,1).getTimezoneOffset();var z=Math.max(k,b);(v(),D)[o>>>2>>>0]=60*z,(v(),R)[l>>>2>>>0]=+(k!=b),o=(l=B=>{var W=Math.abs(B);return`UTC${0<=B?"-":"+"}${String(Math.floor(W/60)).padStart(2,"0")}${String(W%60).padStart(2,"0")}`})(k),l=l(b),b<k?(lt(o,f,17),lt(l,c,17)):(lt(o,c,17),lt(l,f,17))}var xm=()=>Date.now();function Sm(o,l,f){return f>>>=0,0<=o&&3>=o?(o===0?o=Date.now():o=performance.timeOrigin+performance.now(),o=Math.round(1e6*o),(v(),Z)[f>>>3>>>0]=BigInt(o),0):28}var si=[],Gn=(o,l)=>{si.length=0;for(var f;f=(v(),Y)[o++>>>0];){var c=f!=105;l+=(c&=f!=112)&&l%8?4:0,si.push(f==112?(v(),D)[l>>>2>>>0]:f==106?(v(),Z)[l>>>3>>>0]:f==105?(v(),R)[l>>>2>>>0]:(v(),ee)[l>>>3>>>0]),l+=c?8:4}return si};function Tm(o,l,f){return o>>>=0,l=Gn(l>>>0,f>>>0),fi[o](...l)}function km(o,l,f){return o>>>=0,l=Gn(l>>>0,f>>>0),fi[o](...l)}var Im=()=>{};function Em(o,l){return E(Se(o>>>0,l>>>0))}var zm=()=>{throw Ke+=1,"unwind"};function Cm(){return 4294901760}var Am=()=>navigator.hardwareConcurrency,wt={},wr=o=>{var l;return(l=/\bwasm-function\[\d+\]:(0x[0-9a-f]+)/.exec(o))?+l[1]:(l=/:(\d+):\d+(?:\)|$)/.exec(o))?2147483648|+l[1]:0},Hn=o=>{for(var l of o)(o=wr(l))&&(wt[o]=l)};function Om(){var o=Error().stack.toString().split(`
`);return o[0]=="Error"&&o.shift(),Hn(o),wt.sd=wr(o[3]),wt.Md=o,wt.sd}function br(o){if(!(o=wt[o>>>0]))return 0;var l;if(l=/^\s+at .*\.wasm\.(.*) \(.*\)$/.exec(o))o=l[1];else if(l=/^\s+at (.*) \(.*\)$/.exec(o))o=l[1];else{if(!(l=/^(.+?)@/.exec(o)))return 0;o=l[1]}Ye(br.td??0),l=hr(o)+1;var f=Gt(l);return f&&lt(o,f,l),br.td=f,br.td}function Rm(o){o>>>=0;var l=(v(),Y).length;if(o<=l||4294901760<o)return!1;for(var f=1;4>=f;f*=2){var c=l*(1+.2/f);c=Math.min(c,o+100663296);e:{c=(Math.min(4294901760,65536*Math.ceil(Math.max(o,c)/65536))-ut.buffer.byteLength+65535)/65536|0;try{ut.grow(c),L();var b=1;break e}catch{}b=void 0}if(b)return!0}return!1}function Bm(o,l,f){if(o>>>=0,l>>>=0,wt.sd==o)var c=wt.Md;else(c=Error().stack.toString().split(`
`))[0]=="Error"&&c.shift(),Hn(c);for(var b=3;c[b]&&wr(c[b])!=o;)++b;for(o=0;o<f&&c[o+b];++o)(v(),R)[l+4*o>>>2>>>0]=wr(c[o+b]);return o}var oi,ui={},Fn=()=>{if(!oi){var o,l={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:(globalThis.navigator?.language??"C").replace("-","_")+".UTF-8",_:"./this.program"};for(o in ui)ui[o]===void 0?delete l[o]:l[o]=ui[o];var f=[];for(o in l)f.push(`${o}=${l[o]}`);oi=f}return oi};function jn(o,l){if(a)return be(19,1,o,l);o>>>=0,l>>>=0;var f,c=0,b=0;for(f of Fn()){var k=l+c;(v(),D)[o+b>>>2>>>0]=k,c+=lt(f,k,1/0)+1,b+=4}return 0}function Kn(o,l){if(a)return be(20,1,o,l);o>>>=0,l>>>=0;var f=Fn();for(var c of((v(),D)[o>>>2>>>0]=f.length,o=0,f))o+=hr(c)+1;return(v(),D)[l>>>2>>>0]=o,0}function Qn(o){return a?be(21,1,o):52}function Zn(o,l,f,c){return a?be(22,1,o,l,f,c):52}function Yn(o,l,f,c){return a?be(23,1,o,l,f,c):70}var Nm=[null,[],[]];function Xn(o,l,f,c){if(a)return be(24,1,o,l,f,c);l>>>=0,f>>>=0,c>>>=0;for(var b=0,k=0;k<f;k++){var z=(v(),D)[l>>>2>>>0],B=(v(),D)[l+4>>>2>>>0];l+=8;for(var W=0;W<B;W++){var V=o,ae=(v(),Y)[z+W>>>0],pe=Nm[V];ae===0||ae===10?((V===1?S:E)(gn(pe)),pe.length=0):pe.push(ae)}b+=B}return(v(),D)[c>>>2>>>0]=b,0}function Mm(o){return o>>>0}a||(function(){for(var o=t.numThreads-1;o--;)ln();xe.push(async()=>{var l=(async function(){if(!a)return Promise.all(ot.map(un))})();_e++,await l,--_e==0&&ze&&(l=ze,ze=null,l())})})(),a||(ut=new WebAssembly.Memory({initial:256,maximum:65536,shared:!0}),L()),t.wasmBinary&&(g=t.wasmBinary),t.stackSave=()=>se(),t.stackRestore=o=>ne(o),t.stackAlloc=o=>pi(o),t.setValue=function(o,l,f="i8"){switch(f.endsWith("*")&&(f="*"),f){case"i1":case"i8":(v(),q)[o>>>0]=l;break;case"i16":(v(),H)[o>>>1>>>0]=l;break;case"i32":(v(),R)[o>>>2>>>0]=l;break;case"i64":(v(),Z)[o>>>3>>>0]=BigInt(l);break;case"float":(v(),G)[o>>>2>>>0]=l;break;case"double":(v(),ee)[o>>>3>>>0]=l;break;case"*":(v(),D)[o>>>2>>>0]=l;break;default:oe(`invalid type for setValue: ${f}`)}},t.getValue=function(o,l="i8"){switch(l.endsWith("*")&&(l="*"),l){case"i1":case"i8":return(v(),q)[o>>>0];case"i16":return(v(),H)[o>>>1>>>0];case"i32":return(v(),R)[o>>>2>>>0];case"i64":return(v(),Z)[o>>>3>>>0];case"float":return(v(),G)[o>>>2>>>0];case"double":return(v(),ee)[o>>>3>>>0];case"*":return(v(),D)[o>>>2>>>0];default:oe(`invalid type for getValue: ${l}`)}},t.UTF8ToString=Se,t.stringToUTF8=lt,t.lengthBytesUTF8=hr;var Jn,es,$r,Ye,Gt,li,ts,rs,is,di,as,ns,ue,Ht,ss,ne,pi,se,os,ci,us,ls,ds,hi,ps,cs,hs,fs,ms,gs,ys,_s,ws,bs,$s,vs,xs,Ss,Ts,ks,Is,Es,zs,Cs,As,Os,Rs,Bs,Ns,Ms,Ds,Us,Ps,qs,Ws,Ls,Vs,Gs,Hs,Fs,js,Ks,Qs,Zs,rt,Dm=[jr,an,cn,yn,_n,wn,bn,$n,vn,xn,Sn,Tn,kn,In,En,zn,Wn,Ln,Vn,jn,Kn,Qn,Zn,Yn,Xn],fi={927244:(o,l,f,c,b)=>{if(t===void 0||!t.Zc)return 1;if((o=Se(Number(o>>>0))).startsWith("./")&&(o=o.substring(2)),!(o=t.Zc.get(o)))return 2;if(l=Number(l>>>0),f=Number(f>>>0),c=Number(c>>>0),l+f>o.byteLength)return 3;try{let k=o.subarray(l,l+f);switch(b){case 0:(v(),Y).set(k,c>>>0);break;case 1:t.Xd?t.Xd(c,k):t.Ld(c,k);break;default:return 4}return 0}catch{return 4}},928068:(o,l,f)=>{t.xd(o,(v(),Y).subarray(l>>>0,l+f>>>0))},928132:()=>t.Zd(),928174:o=>{t.vd(o)},928211:()=>{t.Ed()},928242:()=>{t.Fd()},928271:()=>{t.Jd()},928296:o=>t.Dd(o),928329:o=>t.Hd(o),928361:(o,l,f)=>{t.jd(Number(o),Number(l),Number(f),!0)},928424:(o,l,f)=>{t.jd(Number(o),Number(l),Number(f))},928481:()=>typeof wasmOffsetConverter<"u",928538:o=>{t.ac("Abs",o,void 0)},928589:o=>{t.ac("Neg",o,void 0)},928640:o=>{t.ac("Floor",o,void 0)},928693:o=>{t.ac("Ceil",o,void 0)},928745:o=>{t.ac("Reciprocal",o,void 0)},928803:o=>{t.ac("Sqrt",o,void 0)},928855:o=>{t.ac("Exp",o,void 0)},928906:o=>{t.ac("Erf",o,void 0)},928957:o=>{t.ac("Sigmoid",o,void 0)},929012:(o,l,f)=>{t.ac("HardSigmoid",o,{alpha:l,beta:f})},929091:o=>{t.ac("Log",o,void 0)},929142:o=>{t.ac("Sin",o,void 0)},929193:o=>{t.ac("Cos",o,void 0)},929244:o=>{t.ac("Tan",o,void 0)},929295:o=>{t.ac("Asin",o,void 0)},929347:o=>{t.ac("Acos",o,void 0)},929399:o=>{t.ac("Atan",o,void 0)},929451:o=>{t.ac("Sinh",o,void 0)},929503:o=>{t.ac("Cosh",o,void 0)},929555:o=>{t.ac("Asinh",o,void 0)},929608:o=>{t.ac("Acosh",o,void 0)},929661:o=>{t.ac("Atanh",o,void 0)},929714:o=>{t.ac("Tanh",o,void 0)},929766:o=>{t.ac("Not",o,void 0)},929817:(o,l,f)=>{t.ac("Clip",o,{min:l,max:f})},929886:o=>{t.ac("Clip",o,void 0)},929938:(o,l)=>{t.ac("Elu",o,{alpha:l})},929996:o=>{t.ac("Gelu",o,void 0)},930048:o=>{t.ac("Relu",o,void 0)},930100:(o,l)=>{t.ac("LeakyRelu",o,{alpha:l})},930164:(o,l)=>{t.ac("ThresholdedRelu",o,{alpha:l})},930234:(o,l)=>{t.ac("Cast",o,{to:l})},930292:o=>{t.ac("Add",o,void 0)},930343:o=>{t.ac("Sub",o,void 0)},930394:o=>{t.ac("Mul",o,void 0)},930445:o=>{t.ac("Div",o,void 0)},930496:o=>{t.ac("Pow",o,void 0)},930547:o=>{t.ac("Equal",o,void 0)},930600:o=>{t.ac("Greater",o,void 0)},930655:o=>{t.ac("GreaterOrEqual",o,void 0)},930717:o=>{t.ac("Less",o,void 0)},930769:o=>{t.ac("LessOrEqual",o,void 0)},930828:(o,l,f,c,b)=>{t.ac("ReduceMean",o,{keepDims:!!l,noopWithEmptyAxes:!!f,axes:c?Array.from((v(),R).subarray(Number(c)>>>0,Number(b)>>>0)):[]})},931003:(o,l,f,c,b)=>{t.ac("ReduceMax",o,{keepDims:!!l,noopWithEmptyAxes:!!f,axes:c?Array.from((v(),R).subarray(Number(c)>>>0,Number(b)>>>0)):[]})},931177:(o,l,f,c,b)=>{t.ac("ReduceMin",o,{keepDims:!!l,noopWithEmptyAxes:!!f,axes:c?Array.from((v(),R).subarray(Number(c)>>>0,Number(b)>>>0)):[]})},931351:(o,l,f,c,b)=>{t.ac("ReduceProd",o,{keepDims:!!l,noopWithEmptyAxes:!!f,axes:c?Array.from((v(),R).subarray(Number(c)>>>0,Number(b)>>>0)):[]})},931526:(o,l,f,c,b)=>{t.ac("ReduceSum",o,{keepDims:!!l,noopWithEmptyAxes:!!f,axes:c?Array.from((v(),R).subarray(Number(c)>>>0,Number(b)>>>0)):[]})},931700:(o,l,f,c,b)=>{t.ac("ReduceL1",o,{keepDims:!!l,noopWithEmptyAxes:!!f,axes:c?Array.from((v(),R).subarray(Number(c)>>>0,Number(b)>>>0)):[]})},931873:(o,l,f,c,b)=>{t.ac("ReduceL2",o,{keepDims:!!l,noopWithEmptyAxes:!!f,axes:c?Array.from((v(),R).subarray(Number(c)>>>0,Number(b)>>>0)):[]})},932046:(o,l,f,c,b)=>{t.ac("ReduceLogSum",o,{keepDims:!!l,noopWithEmptyAxes:!!f,axes:c?Array.from((v(),R).subarray(Number(c)>>>0,Number(b)>>>0)):[]})},932223:(o,l,f,c,b)=>{t.ac("ReduceSumSquare",o,{keepDims:!!l,noopWithEmptyAxes:!!f,axes:c?Array.from((v(),R).subarray(Number(c)>>>0,Number(b)>>>0)):[]})},932403:(o,l,f,c,b)=>{t.ac("ReduceLogSumExp",o,{keepDims:!!l,noopWithEmptyAxes:!!f,axes:c?Array.from((v(),R).subarray(Number(c)>>>0,Number(b)>>>0)):[]})},932583:o=>{t.ac("Where",o,void 0)},932636:(o,l,f)=>{t.ac("Transpose",o,{perm:l?Array.from((v(),R).subarray(Number(l)>>>0,Number(f)>>>0)):[]})},932760:(o,l,f,c)=>{t.ac("DepthToSpace",o,{blocksize:l,mode:Se(f),format:c?"NHWC":"NCHW"})},932893:(o,l,f,c)=>{t.ac("DepthToSpace",o,{blocksize:l,mode:Se(f),format:c?"NHWC":"NCHW"})},933026:(o,l,f,c,b,k,z,B,W,V,ae,pe,me,ye,pt)=>{t.ac("ConvTranspose",o,{format:W?"NHWC":"NCHW",autoPad:l,dilations:[f],group:c,kernelShape:[b],pads:[k,z],strides:[B],wIsConst:()=>!!(v(),q)[V>>>0],outputPadding:ae?Array.from((v(),R).subarray(Number(ae)>>>0,Number(pe)>>>0)):[],outputShape:me?Array.from((v(),R).subarray(Number(me)>>>0,Number(ye)>>>0)):[],activation:Se(pt)})},933459:(o,l,f,c,b,k,z,B,W,V,ae,pe,me,ye)=>{t.ac("ConvTranspose",o,{format:B?"NHWC":"NCHW",autoPad:l,dilations:Array.from((v(),R).subarray(Number(f)>>>0,2+(Number(f)>>>0)>>>0)),group:c,kernelShape:Array.from((v(),R).subarray(Number(b)>>>0,2+(Number(b)>>>0)>>>0)),pads:Array.from((v(),R).subarray(Number(k)>>>0,4+(Number(k)>>>0)>>>0)),strides:Array.from((v(),R).subarray(Number(z)>>>0,2+(Number(z)>>>0)>>>0)),wIsConst:()=>!!(v(),q)[W>>>0],outputPadding:V?Array.from((v(),R).subarray(Number(V)>>>0,Number(ae)>>>0)):[],outputShape:pe?Array.from((v(),R).subarray(Number(pe)>>>0,Number(me)>>>0)):[],activation:Se(ye)})},934120:(o,l,f,c,b,k,z,B,W,V,ae,pe,me,ye,pt)=>{t.ac("ConvTranspose",o,{format:W?"NHWC":"NCHW",autoPad:l,dilations:[f],group:c,kernelShape:[b],pads:[k,z],strides:[B],wIsConst:()=>!!(v(),q)[V>>>0],outputPadding:ae?Array.from((v(),R).subarray(Number(ae)>>>0,Number(pe)>>>0)):[],outputShape:me?Array.from((v(),R).subarray(Number(me)>>>0,Number(ye)>>>0)):[],activation:Se(pt)})},934553:(o,l,f,c,b,k,z,B,W,V,ae,pe,me,ye)=>{t.ac("ConvTranspose",o,{format:B?"NHWC":"NCHW",autoPad:l,dilations:Array.from((v(),R).subarray(Number(f)>>>0,2+(Number(f)>>>0)>>>0)),group:c,kernelShape:Array.from((v(),R).subarray(Number(b)>>>0,2+(Number(b)>>>0)>>>0)),pads:Array.from((v(),R).subarray(Number(k)>>>0,4+(Number(k)>>>0)>>>0)),strides:Array.from((v(),R).subarray(Number(z)>>>0,2+(Number(z)>>>0)>>>0)),wIsConst:()=>!!(v(),q)[W>>>0],outputPadding:V?Array.from((v(),R).subarray(Number(V)>>>0,Number(ae)>>>0)):[],outputShape:pe?Array.from((v(),R).subarray(Number(pe)>>>0,Number(me)>>>0)):[],activation:Se(ye)})},935214:(o,l)=>{t.ac("GlobalAveragePool",o,{format:l?"NHWC":"NCHW"})},935305:(o,l,f,c,b,k,z,B,W,V,ae,pe,me,ye)=>{t.ac("AveragePool",o,{format:ye?"NHWC":"NCHW",auto_pad:l,ceil_mode:f,count_include_pad:c,storage_order:b,dilations:k?Array.from((v(),R).subarray(Number(k)>>>0,Number(z)>>>0)):[],kernel_shape:B?Array.from((v(),R).subarray(Number(B)>>>0,Number(W)>>>0)):[],pads:V?Array.from((v(),R).subarray(Number(V)>>>0,Number(ae)>>>0)):[],strides:pe?Array.from((v(),R).subarray(Number(pe)>>>0,Number(me)>>>0)):[]})},935784:(o,l)=>{t.ac("GlobalAveragePool",o,{format:l?"NHWC":"NCHW"})},935875:(o,l,f,c,b,k,z,B,W,V,ae,pe,me,ye)=>{t.ac("AveragePool",o,{format:ye?"NHWC":"NCHW",auto_pad:l,ceil_mode:f,count_include_pad:c,storage_order:b,dilations:k?Array.from((v(),R).subarray(Number(k)>>>0,Number(z)>>>0)):[],kernel_shape:B?Array.from((v(),R).subarray(Number(B)>>>0,Number(W)>>>0)):[],pads:V?Array.from((v(),R).subarray(Number(V)>>>0,Number(ae)>>>0)):[],strides:pe?Array.from((v(),R).subarray(Number(pe)>>>0,Number(me)>>>0)):[]})},936354:(o,l)=>{t.ac("GlobalMaxPool",o,{format:l?"NHWC":"NCHW"})},936441:(o,l,f,c,b,k,z,B,W,V,ae,pe,me,ye)=>{t.ac("MaxPool",o,{format:ye?"NHWC":"NCHW",auto_pad:l,ceil_mode:f,count_include_pad:c,storage_order:b,dilations:k?Array.from((v(),R).subarray(Number(k)>>>0,Number(z)>>>0)):[],kernel_shape:B?Array.from((v(),R).subarray(Number(B)>>>0,Number(W)>>>0)):[],pads:V?Array.from((v(),R).subarray(Number(V)>>>0,Number(ae)>>>0)):[],strides:pe?Array.from((v(),R).subarray(Number(pe)>>>0,Number(me)>>>0)):[]})},936916:(o,l)=>{t.ac("GlobalMaxPool",o,{format:l?"NHWC":"NCHW"})},937003:(o,l,f,c,b,k,z,B,W,V,ae,pe,me,ye)=>{t.ac("MaxPool",o,{format:ye?"NHWC":"NCHW",auto_pad:l,ceil_mode:f,count_include_pad:c,storage_order:b,dilations:k?Array.from((v(),R).subarray(Number(k)>>>0,Number(z)>>>0)):[],kernel_shape:B?Array.from((v(),R).subarray(Number(B)>>>0,Number(W)>>>0)):[],pads:V?Array.from((v(),R).subarray(Number(V)>>>0,Number(ae)>>>0)):[],strides:pe?Array.from((v(),R).subarray(Number(pe)>>>0,Number(me)>>>0)):[]})},937478:(o,l,f,c,b)=>{t.ac("Gemm",o,{alpha:l,beta:f,transA:c,transB:b})},937582:o=>{t.ac("MatMul",o,void 0)},937636:(o,l,f,c)=>{t.ac("ArgMax",o,{keepDims:!!l,selectLastIndex:!!f,axis:c})},937744:(o,l,f,c)=>{t.ac("ArgMin",o,{keepDims:!!l,selectLastIndex:!!f,axis:c})},937852:(o,l)=>{t.ac("Softmax",o,{axis:l})},937915:(o,l)=>{t.ac("Concat",o,{axis:l})},937975:(o,l,f,c,b)=>{t.ac("Split",o,{axis:l,numOutputs:f,splitSizes:c?Array.from((v(),R).subarray(Number(c)>>>0,Number(b)>>>0)):[]})},938131:o=>{t.ac("Expand",o,void 0)},938185:(o,l)=>{t.ac("Gather",o,{axis:Number(l)})},938256:(o,l)=>{t.ac("GatherElements",o,{axis:Number(l)})},938335:(o,l)=>{t.ac("GatherND",o,{batch_dims:Number(l)})},938414:(o,l,f,c,b,k,z,B,W,V,ae)=>{t.ac("Resize",o,{antialias:l,axes:f?Array.from((v(),R).subarray(Number(f)>>>0,Number(c)>>>0)):[],coordinateTransformMode:Se(b),cubicCoeffA:k,excludeOutside:z,extrapolationValue:B,keepAspectRatioPolicy:Se(W),mode:Se(V),nearestMode:Se(ae)})},938776:(o,l,f,c,b,k,z)=>{t.ac("Slice",o,{starts:l?Array.from((v(),R).subarray(Number(l)>>>0,Number(f)>>>0)):[],ends:c?Array.from((v(),R).subarray(Number(c)>>>0,Number(b)>>>0)):[],axes:k?Array.from((v(),R).subarray(Number(k)>>>0,Number(z)>>>0)):[]})},939040:o=>{t.ac("Tile",o,void 0)},939092:(o,l,f)=>{t.ac("InstanceNormalization",o,{epsilon:l,format:f?"NHWC":"NCHW"})},939206:(o,l,f)=>{t.ac("InstanceNormalization",o,{epsilon:l,format:f?"NHWC":"NCHW"})},939320:o=>{t.ac("Range",o,void 0)},939373:(o,l)=>{t.ac("Einsum",o,{equation:Se(l)})},939454:(o,l,f,c,b)=>{t.ac("Pad",o,{mode:l,value:f,pads:c?Array.from((v(),R).subarray(Number(c)>>>0,Number(b)>>>0)):[]})},939597:(o,l,f,c,b,k)=>{t.ac("BatchNormalization",o,{epsilon:l,momentum:f,spatial:!!b,trainingMode:!!c,format:k?"NHWC":"NCHW"})},939766:(o,l,f,c,b,k)=>{t.ac("BatchNormalization",o,{epsilon:l,momentum:f,spatial:!!b,trainingMode:!!c,format:k?"NHWC":"NCHW"})},939935:(o,l,f)=>{t.ac("CumSum",o,{exclusive:Number(l),reverse:Number(f)})},940032:(o,l,f)=>{t.ac("DequantizeLinear",o,{axis:l,blockSize:f})},940122:(o,l,f,c,b)=>{t.ac("GridSample",o,{align_corners:l,mode:Se(f),padding_mode:Se(c),format:b?"NHWC":"NCHW"})},940292:(o,l,f,c,b)=>{t.ac("GridSample",o,{align_corners:l,mode:Se(f),padding_mode:Se(c),format:b?"NHWC":"NCHW"})},940462:(o,l)=>{t.ac("ScatterND",o,{reduction:Se(l)})},940547:(o,l,f,c,b,k,z,B,W)=>{t.ac("Attention",o,{numHeads:l,isUnidirectional:f,maskFilterValue:c,scale:b,doRotary:k,qkvHiddenSizes:z?Array.from((v(),R).subarray(Number(B)>>>0,Number(B)+z>>>0)):[],pastPresentShareBuffer:!!W})},940819:o=>{t.ac("BiasAdd",o,void 0)},940874:o=>{t.ac("BiasSplitGelu",o,void 0)},940935:o=>{t.ac("FastGelu",o,void 0)},940991:(o,l,f,c,b,k,z,B,W,V,ae,pe,me,ye,pt,mi)=>{t.ac("Conv",o,{format:pe?"NHWC":"NCHW",auto_pad:l,dilations:f?Array.from((v(),R).subarray(Number(f)>>>0,Number(c)>>>0)):[],group:b,kernel_shape:k?Array.from((v(),R).subarray(Number(k)>>>0,Number(z)>>>0)):[],pads:B?Array.from((v(),R).subarray(Number(B)>>>0,Number(W)>>>0)):[],strides:V?Array.from((v(),R).subarray(Number(V)>>>0,Number(ae)>>>0)):[],w_is_const:()=>!!(v(),q)[Number(me)>>>0],activation:Se(ye),activation_params:pt?Array.from((v(),G).subarray(Number(pt)>>>0,Number(mi)>>>0)):[]})},941575:o=>{t.ac("Gelu",o,void 0)},941627:(o,l,f,c,b,k,z,B,W)=>{t.ac("GroupQueryAttention",o,{numHeads:l,kvNumHeads:f,scale:c,softcap:b,doRotary:k,rotaryInterleaved:z,smoothSoftmax:B,localWindowSize:W})},941844:(o,l,f,c)=>{t.ac("LayerNormalization",o,{axis:l,epsilon:f,simplified:!!c})},941955:(o,l,f,c)=>{t.ac("LayerNormalization",o,{axis:l,epsilon:f,simplified:!!c})},942066:(o,l,f,c,b,k)=>{t.ac("MatMulNBits",o,{k:l,n:f,accuracyLevel:c,bits:b,blockSize:k})},942193:(o,l,f,c,b,k)=>{t.ac("MultiHeadAttention",o,{numHeads:l,isUnidirectional:f,maskFilterValue:c,scale:b,doRotary:k})},942352:(o,l)=>{t.ac("QuickGelu",o,{alpha:l})},942416:(o,l,f,c,b)=>{t.ac("RotaryEmbedding",o,{interleaved:!!l,numHeads:f,rotaryEmbeddingDim:c,scale:b})},942555:(o,l,f)=>{t.ac("SkipLayerNormalization",o,{epsilon:l,simplified:!!f})},942657:(o,l,f)=>{t.ac("SkipLayerNormalization",o,{epsilon:l,simplified:!!f})},942759:(o,l,f,c)=>{t.ac("GatherBlockQuantized",o,{gatherAxis:l,quantizeAxis:f,blockSize:c})},942880:o=>{t.Id(o)},942914:(o,l)=>t.Kd(Number(o),Number(l),t.$c.Nd,t.$c.errors)};function Um(o,l,f){return Mn(async()=>{await t.Gd(Number(o),Number(l),Number(f))})}function Pm(){return typeof wasmOffsetConverter<"u"}function qm(o,l,f,c){var b=se();try{return _s(o,l,f,c)}catch(k){if(ne(b),k!==k+0)throw k;ue(1,0)}}function Wm(o,l,f){var c=se();try{return fs(o,l,f)}catch(b){if(ne(c),b!==b+0)throw b;ue(1,0)}}function Lm(o,l,f){var c=se();try{ds(o,l,f)}catch(b){if(ne(c),b!==b+0)throw b;ue(1,0)}}function Vm(o,l){var f=se();try{return hi(o,l)}catch(c){if(ne(f),c!==c+0)throw c;ue(1,0)}}function Gm(o){var l=se();try{ps(o)}catch(f){if(ne(l),f!==f+0)throw f;ue(1,0)}}function Hm(o,l,f,c,b,k,z){var B=se();try{return gs(o,l,f,c,b,k,z)}catch(W){if(ne(B),W!==W+0)throw W;ue(1,0)}}function Fm(o,l){var f=se();try{ws(o,l)}catch(c){if(ne(f),c!==c+0)throw c;ue(1,0)}}function jm(o,l,f,c,b,k){var z=se();try{cs(o,l,f,c,b,k)}catch(B){if(ne(z),B!==B+0)throw B;ue(1,0)}}function Km(o,l,f,c){var b=se();try{ys(o,l,f,c)}catch(k){if(ne(b),k!==k+0)throw k;ue(1,0)}}function Qm(o,l,f,c,b){var k=se();try{hs(o,l,f,c,b)}catch(z){if(ne(k),z!==z+0)throw z;ue(1,0)}}function Zm(o,l,f,c,b,k,z){var B=se();try{$s(o,l,f,c,b,k,z)}catch(W){if(ne(B),W!==W+0)throw W;ue(1,0)}}function Ym(o,l,f,c,b,k,z){var B=se();try{vs(o,l,f,c,b,k,z)}catch(W){if(ne(B),W!==W+0)throw W;ue(1,0)}}function Xm(o,l,f,c,b,k,z,B){var W=se();try{ks(o,l,f,c,b,k,z,B)}catch(V){if(ne(W),V!==V+0)throw V;ue(1,0)}}function Jm(o,l,f,c,b){var k=se();try{return bs(o,l,f,c,b)}catch(z){if(ne(k),z!==z+0)throw z;ue(1,0)}}function eg(o,l,f,c,b,k,z,B){var W=se();try{Is(o,l,f,c,b,k,z,B)}catch(V){if(ne(W),V!==V+0)throw V;ue(1,0)}}function tg(o,l,f,c,b,k,z,B,W,V,ae,pe){var me=se();try{xs(o,l,f,c,b,k,z,B,W,V,ae,pe)}catch(ye){if(ne(me),ye!==ye+0)throw ye;ue(1,0)}}function rg(o,l,f,c,b,k){var z=se();try{return Ss(o,l,f,c,b,k)}catch(B){if(ne(z),B!==B+0)throw B;ue(1,0)}}function ig(o,l,f){var c=se();try{return Es(o,l,f)}catch(b){if(ne(c),b!==b+0)throw b;return ue(1,0),0n}}function ag(o,l,f,c,b,k,z,B,W){var V=se();try{ms(o,l,f,c,b,k,z,B,W)}catch(ae){if(ne(V),ae!==ae+0)throw ae;ue(1,0)}}function ng(o){var l=se();try{return zs(o)}catch(f){if(ne(l),f!==f+0)throw f;ue(1,0)}}function sg(o,l,f){var c=se();try{return Cs(o,l,f)}catch(b){if(ne(c),b!==b+0)throw b;ue(1,0)}}function og(o,l){var f=se();try{return Fs(o,l)}catch(c){if(ne(f),c!==c+0)throw c;return ue(1,0),0n}}function ug(o,l,f,c,b){var k=se();try{As(o,l,f,c,b)}catch(z){if(ne(k),z!==z+0)throw z;ue(1,0)}}function lg(o){var l=se();try{return Os(o)}catch(f){if(ne(l),f!==f+0)throw f;return ue(1,0),0n}}function dg(o,l,f,c,b,k){var z=se();try{return Us(o,l,f,c,b,k)}catch(B){if(ne(z),B!==B+0)throw B;ue(1,0)}}function pg(o,l,f,c,b,k){var z=se();try{return Ps(o,l,f,c,b,k)}catch(B){if(ne(z),B!==B+0)throw B;ue(1,0)}}function cg(o,l,f,c,b,k,z,B){var W=se();try{return Ts(o,l,f,c,b,k,z,B)}catch(V){if(ne(W),V!==V+0)throw V;ue(1,0)}}function hg(o,l,f,c,b){var k=se();try{return qs(o,l,f,c,b)}catch(z){if(ne(k),z!==z+0)throw z;return ue(1,0),0n}}function fg(o,l,f,c){var b=se();try{return Ws(o,l,f,c)}catch(k){if(ne(b),k!==k+0)throw k;ue(1,0)}}function mg(o,l,f,c){var b=se();try{return Ls(o,l,f,c)}catch(k){if(ne(b),k!==k+0)throw k;ue(1,0)}}function gg(o,l,f,c,b,k,z,B,W,V,ae,pe){var me=se();try{return Vs(o,l,f,c,b,k,z,B,W,V,ae,pe)}catch(ye){if(ne(me),ye!==ye+0)throw ye;ue(1,0)}}function yg(o,l,f,c,b,k,z,B,W,V,ae){var pe=se();try{Ms(o,l,f,c,b,k,z,B,W,V,ae)}catch(me){if(ne(pe),me!==me+0)throw me;ue(1,0)}}function _g(o,l,f,c,b,k,z,B,W,V,ae,pe,me,ye,pt,mi){var Sg=se();try{Ds(o,l,f,c,b,k,z,B,W,V,ae,pe,me,ye,pt,mi)}catch(gi){if(ne(Sg),gi!==gi+0)throw gi;ue(1,0)}}function wg(o,l,f,c){var b=se();try{return Gs(o,l,f,c)}catch(k){if(ne(b),k!==k+0)throw k;ue(1,0)}}function bg(o,l,f,c,b){var k=se();try{return Hs(o,l,f,c,b)}catch(z){if(ne(k),z!==z+0)throw z;ue(1,0)}}function $g(o,l,f){var c=se();try{return Rs(o,l,f)}catch(b){if(ne(c),b!==b+0)throw b;ue(1,0)}}function vg(o,l,f){var c=se();try{return Bs(o,l,f)}catch(b){if(ne(c),b!==b+0)throw b;ue(1,0)}}function xg(o,l,f,c){var b=se();try{Ns(o,l,f,c)}catch(k){if(ne(b),k!==k+0)throw k;ue(1,0)}}function vr(){if(0<_e)ze=vr;else if(a)$?.(t),te();else{for(var o=xe;0<o.length;)o.shift()(t);0<_e?ze=vr:(t.calledRun=!0,C||(te(),$?.(t)))}}return a||(rt=await Oe(),vr()),t.PTR_SIZE=4,M?t:new Promise((o,l)=>{$=o,T=l})}var ep,Js,Gg=P(()=>{ep=Xs,Js=globalThis.self?.name?.startsWith("em-pthread"),Js&&Xs()}),vi,ha,eo,Re,tp,Sr,to,ro,xi,io,Si,rp,Ti,ip,Oa=P(()=>{Aa(),vi=typeof location>"u"?void 0:location.origin,ha=import.meta.url>"file:"&&import.meta.url<"file;",eo=()=>{{if(ha){let e=URL;return new URL(new e("ort.bundle.min.mjs",import.meta.url).href,vi).href}return import.meta.url}},Re=eo(),tp=()=>{if(Re&&!Re.startsWith("blob:"))return Re.substring(0,Re.lastIndexOf("/")+1)},Sr=(e,t)=>{try{let r=t??Re;return(r?new URL(e,r):new URL(e)).origin===vi}catch{return!1}},to=(e,t)=>{let r=t??Re;try{return(r?new URL(e,r):new URL(e)).href}catch{return}},ro=(e,t)=>`${t??"./"}${e}`,xi=async e=>{let t=await(await fetch(e,{credentials:"same-origin"})).blob();return URL.createObjectURL(t)},io=async e=>(await import(e)).default,Si=(Vg(),ur(Yd)).default,rp=async()=>{if(!Re)throw new Error("Failed to load proxy worker: cannot determine the script source URL.");if(Sr(Re))return[void 0,Si()];let e=await xi(Re);return[e,Si(e)]},Ti=(Gg(),ur(Jd)).default,ip=async(e,t,r,i)=>{let a=Ti&&!(e||t);if(a)if(Re)a=Sr(Re);else if(i&&!r)a=!0;else throw new Error("cannot determine the script source URL.");if(a)return[void 0,Ti];{let n="ort-wasm-simd-threaded.jsep.mjs",s=e??to(n,t),u=r&&s&&!Sr(s,t),d=u?await xi(s):s??ro(n,t);return[u?d:void 0,await io(d)]}}}),ki,Tr,jt,Ii,ao,no,so,Ra,ge,Ot=P(()=>{Oa(),Tr=!1,jt=!1,Ii=!1,ao=()=>{if(typeof SharedArrayBuffer>"u")return!1;try{return typeof MessageChannel<"u"&&new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)),WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,5,4,1,3,1,1,10,11,1,9,0,65,0,254,16,2,0,26,11]))}catch{return!1}},no=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,10,30,1,28,0,65,0,253,15,253,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,253,186,1,26,11]))}catch{return!1}},so=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,19,1,17,0,65,1,253,15,65,2,253,15,65,3,253,15,253,147,2,11]))}catch{return!1}},Ra=async e=>{if(Tr)return Promise.resolve();if(jt)throw new Error("multiple calls to 'initializeWebAssembly()' detected.");if(Ii)throw new Error("previous call to 'initializeWebAssembly()' failed.");jt=!0;let t=e.initTimeout,r=e.numThreads;if(e.simd!==!1){if(e.simd==="relaxed"){if(!so())throw new Error("Relaxed WebAssembly SIMD is not supported in the current environment.")}else if(!no())throw new Error("WebAssembly SIMD is not supported in the current environment.")}let i=ao();r>1&&!i&&(typeof self<"u"&&!self.crossOriginIsolated&&console.warn("env.wasm.numThreads is set to "+r+", but this will not work unless you enable crossOriginIsolated mode. See https://web.dev/cross-origin-isolation-guide/ for more info."),console.warn("WebAssembly multi-threading is not supported in the current environment. Falling back to single-threading."),e.numThreads=r=1);let a=e.wasmPaths,n=typeof a=="string"?a:void 0,s=a?.mjs,u=s?.href??s,d=a?.wasm,p=d?.href??d,m=e.wasmBinary,[h,g]=await ip(u,n,r>1,!!m||!!p),y=!1,_=[];if(t>0&&_.push(new Promise($=>{setTimeout(()=>{y=!0,$()},t)})),_.push(new Promise(($,T)=>{let x={numThreads:r};if(m)x.wasmBinary=m;else if(p||n)x.locateFile=w=>p??n+w;else if(u&&u.indexOf("blob:")!==0)x.locateFile=w=>new URL(w,u).href;else if(h){let w=tp();w&&(x.locateFile=I=>w+I)}g(x).then(w=>{jt=!1,Tr=!0,ki=w,$(),h&&URL.revokeObjectURL(h)},w=>{jt=!1,Ii=!0,T(w)})})),await Promise.race(_),y)throw new Error(`WebAssembly backend initializing failed due to timeout: ${t}ms`)},ge=()=>{if(Tr&&ki)return ki;throw new Error("WebAssembly is not initialized yet.")}}),Fe,Pr,fe,Ba=P(()=>{Ot(),Fe=(e,t)=>{let r=ge(),i=r.lengthBytesUTF8(e)+1,a=r._malloc(i);return r.stringToUTF8(e,a,i),t.push(a),a},Pr=(e,t,r,i)=>{if(typeof e=="object"&&e!==null){if(r.has(e))throw new Error("Circular reference in options");r.add(e)}Object.entries(e).forEach(([a,n])=>{let s=t?t+a:a;if(typeof n=="object")Pr(n,s+".",r,i);else if(typeof n=="string"||typeof n=="number")i(s,n.toString());else if(typeof n=="boolean")i(s,n?"1":"0");else throw new Error(`Can't handle extra config type: ${typeof n}`)})},fe=e=>{let t=ge(),r=t.stackSave();try{let i=t.PTR_SIZE,a=t.stackAlloc(2*i);t._OrtGetLastError(a,a+i);let n=Number(t.getValue(a,i===4?"i32":"i64")),s=t.getValue(a+i,"*"),u=s?t.UTF8ToString(s):"";throw new Error(`${e} ERROR_CODE: ${n}, ERROR_MESSAGE: ${u}`)}finally{t.stackRestore(r)}}}),ap,Hg=P(()=>{Ot(),Ba(),ap=e=>{let t=ge(),r=0,i=[],a=e||{};try{if(e?.logSeverityLevel===void 0)a.logSeverityLevel=2;else if(typeof e.logSeverityLevel!="number"||!Number.isInteger(e.logSeverityLevel)||e.logSeverityLevel<0||e.logSeverityLevel>4)throw new Error(`log severity level is not valid: ${e.logSeverityLevel}`);if(e?.logVerbosityLevel===void 0)a.logVerbosityLevel=0;else if(typeof e.logVerbosityLevel!="number"||!Number.isInteger(e.logVerbosityLevel))throw new Error(`log verbosity level is not valid: ${e.logVerbosityLevel}`);e?.terminate===void 0&&(a.terminate=!1);let n=0;return e?.tag!==void 0&&(n=Fe(e.tag,i)),r=t._OrtCreateRunOptions(a.logSeverityLevel,a.logVerbosityLevel,!!a.terminate,n),r===0&&fe("Can't create run options."),e?.extra!==void 0&&Pr(e.extra,"",new WeakSet,(s,u)=>{let d=Fe(s,i),p=Fe(u,i);t._OrtAddRunConfigEntry(r,d,p)!==0&&fe(`Can't set a run config entry: ${s} - ${u}.`)}),[r,i]}catch(n){throw r!==0&&t._OrtReleaseRunOptions(r),i.forEach(s=>t._free(s)),n}}}),oo,uo,lo,Kt,po,np,Fg=P(()=>{Ot(),Ba(),oo=e=>{switch(e){case"disabled":return 0;case"basic":return 1;case"extended":return 2;case"layout":return 3;case"all":return 99;default:throw new Error(`unsupported graph optimization level: ${e}`)}},uo=e=>{switch(e){case"sequential":return 0;case"parallel":return 1;default:throw new Error(`unsupported execution mode: ${e}`)}},lo=e=>{e.extra||(e.extra={}),e.extra.session||(e.extra.session={});let t=e.extra.session;t.use_ort_model_bytes_directly||(t.use_ort_model_bytes_directly="1"),e.executionProviders&&e.executionProviders.some(r=>(typeof r=="string"?r:r.name)==="webgpu")&&(e.enableMemPattern=!1)},Kt=(e,t,r,i)=>{let a=Fe(t,i),n=Fe(r,i);ge()._OrtAddSessionConfigEntry(e,a,n)!==0&&fe(`Can't set a session config entry: ${t} - ${r}.`)},po=async(e,t,r)=>{let i=t.executionProviders;for(let a of i){let n=typeof a=="string"?a:a.name,s=[];switch(n){case"webnn":if(n="WEBNN",typeof a!="string"){let h=a?.deviceType;h&&Kt(e,"deviceType",h,r)}break;case"webgpu":if(n="JS",typeof a!="string"){let h=a;if(h?.preferredLayout){if(h.preferredLayout!=="NCHW"&&h.preferredLayout!=="NHWC")throw new Error(`preferredLayout must be either 'NCHW' or 'NHWC': ${h.preferredLayout}`);Kt(e,"preferredLayout",h.preferredLayout,r)}}break;case"wasm":case"cpu":continue;default:throw new Error(`not supported execution provider: ${n}`)}let u=Fe(n,r),d=s.length,p=0,m=0;if(d>0){p=ge()._malloc(d*ge().PTR_SIZE),r.push(p),m=ge()._malloc(d*ge().PTR_SIZE),r.push(m);for(let h=0;h<d;h++)ge().setValue(p+h*ge().PTR_SIZE,s[h][0],"*"),ge().setValue(m+h*ge().PTR_SIZE,s[h][1],"*")}await ge()._OrtAppendExecutionProvider(e,u,p,m,d)!==0&&fe(`Can't append execution provider: ${n}.`)}},np=async e=>{let t=ge(),r=0,i=[],a=e||{};lo(a);try{let n=oo(a.graphOptimizationLevel??"all"),s=uo(a.executionMode??"sequential"),u=typeof a.logId=="string"?Fe(a.logId,i):0,d=a.logSeverityLevel??2;if(!Number.isInteger(d)||d<0||d>4)throw new Error(`log severity level is not valid: ${d}`);let p=a.logVerbosityLevel??0;if(!Number.isInteger(p)||p<0||p>4)throw new Error(`log verbosity level is not valid: ${p}`);let m=typeof a.optimizedModelFilePath=="string"?Fe(a.optimizedModelFilePath,i):0;if(r=t._OrtCreateSessionOptions(n,!!a.enableCpuMemArena,!!a.enableMemPattern,s,!!a.enableProfiling,0,u,d,p,m),r===0&&fe("Can't create session options."),a.executionProviders&&await po(r,a,i),a.enableGraphCapture!==void 0){if(typeof a.enableGraphCapture!="boolean")throw new Error(`enableGraphCapture must be a boolean value: ${a.enableGraphCapture}`);Kt(r,"enableGraphCapture",a.enableGraphCapture.toString(),i)}if(a.freeDimensionOverrides)for(let[h,g]of Object.entries(a.freeDimensionOverrides)){if(typeof h!="string")throw new Error(`free dimension override name must be a string: ${h}`);if(typeof g!="number"||!Number.isInteger(g)||g<0)throw new Error(`free dimension override value must be a non-negative integer: ${g}`);let y=Fe(h,i);t._OrtAddFreeDimensionOverride(r,y,g)!==0&&fe(`Can't set a free dimension override: ${h} - ${g}.`)}return a.extra!==void 0&&Pr(a.extra,"",new WeakSet,(h,g)=>{Kt(r,h,g,i)}),[r,i]}catch(n){throw r!==0&&t._OrtReleaseSessionOptions(r)!==0&&fe("Can't release session options."),i.forEach(s=>t._free(s)),n}}}),Tt,at,kt,Fr,qr,Na,Ma,fa,J=P(()=>{Tt=e=>{switch(e){case"int8":return 3;case"uint8":return 2;case"bool":return 9;case"int16":return 5;case"uint16":return 4;case"int32":return 6;case"uint32":return 12;case"float16":return 10;case"float32":return 1;case"float64":return 11;case"string":return 8;case"int64":return 7;case"uint64":return 13;case"int4":return 22;case"uint4":return 21;default:throw new Error(`unsupported data type: ${e}`)}},at=e=>{switch(e){case 3:return"int8";case 2:return"uint8";case 9:return"bool";case 5:return"int16";case 4:return"uint16";case 6:return"int32";case 12:return"uint32";case 10:return"float16";case 1:return"float32";case 11:return"float64";case 8:return"string";case 7:return"int64";case 13:return"uint64";case 22:return"int4";case 21:return"uint4";default:throw new Error(`unsupported data type: ${e}`)}},kt=(e,t)=>{let r=[-1,4,1,1,2,2,4,8,-1,1,2,8,4,8,-1,-1,-1,-1,-1,-1,-1,.5,.5][e],i=typeof t=="number"?t:t.reduce((a,n)=>a*n,1);return r>0?Math.ceil(i*r):void 0},Fr=e=>{switch(e){case"float16":return typeof Float16Array<"u"&&Float16Array.from?Float16Array:Uint16Array;case"float32":return Float32Array;case"uint8":return Uint8Array;case"int8":return Int8Array;case"uint16":return Uint16Array;case"int16":return Int16Array;case"int32":return Int32Array;case"bool":return Uint8Array;case"float64":return Float64Array;case"uint32":return Uint32Array;case"int64":return BigInt64Array;case"uint64":return BigUint64Array;default:throw new Error(`unsupported type: ${e}`)}},qr=e=>{switch(e){case"verbose":return 0;case"info":return 1;case"warning":return 2;case"error":return 3;case"fatal":return 4;default:throw new Error(`unsupported logging level: ${e}`)}},Na=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",Ma=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint64"||e==="int8"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",fa=e=>{switch(e){case"none":return 0;case"cpu":return 1;case"cpu-pinned":return 2;case"texture":return 3;case"gpu-buffer":return 4;case"ml-tensor":return 5;default:throw new Error(`unsupported data location: ${e}`)}}}),Da,sp=P(()=>{Aa(),Da=async e=>{if(typeof e=="string"){let t=await fetch(e);if(!t.ok)throw new Error(`failed to load external data file: ${e}`);let r=t.headers.get("Content-Length"),i=r?parseInt(r,10):0;if(i<1073741824)return new Uint8Array(await t.arrayBuffer());{if(!t.body)throw new Error(`failed to load external data file: ${e}, no response body.`);let a=t.body.getReader(),n;try{n=new ArrayBuffer(i)}catch(u){if(u instanceof RangeError){let d=Math.ceil(i/65536);n=new WebAssembly.Memory({initial:d,maximum:d}).buffer}else throw u}let s=0;for(;;){let{done:u,value:d}=await a.read();if(u)break;let p=d.byteLength;new Uint8Array(n,s,p).set(d),s+=p}return new Uint8Array(n,0,i)}}else return e instanceof Blob?new Uint8Array(await e.arrayBuffer()):e instanceof Uint8Array?e:new Uint8Array(e)}}),co,ho,fo,mo,Ua,go,le,nt=P(()=>{J(),co=["V","I","W","E","F"],ho=(e,t)=>{console.log(`[${co[e]},${new Date().toISOString()}]${t}`)},Ua=(e,t)=>{fo=e,mo=t},go=(e,t)=>{let r=qr(e),i=qr(fo);r>=i&&ho(r,typeof t=="function"?t():t)},le=(...e)=>{mo&&go(...e)}}),yo,Pt,O,Wr,op,up,lp,re=P(()=>{yo=class{static calcMatMulShape(e,t){return e[1]!==t[0]?void 0:[e[0],t[1]]}},Pt=class{static calcShape(e,t,r=!1){let i=e.length,a=t.length;if(i===0)return t;if(a===0)return e;let n=Math.max(e.length,t.length),s=new Array(n);if(r){if(i<2||a<2)return;let u=yo.calcMatMulShape([e[i-2],e[i-1]],[t[a-2],t[a-1]]);if(u===void 0)return;[s[n-2],s[n-1]]=u}for(let u=r?3:1;u<=n;u++){let d=i-u<0?1:e[i-u],p=a-u<0?1:t[a-u];if(d!==p&&d>1&&p>1)return;let m=Math.max(d,p);if(d&&p)s[n-u]=Math.max(d,p);else{if(m>1)return;s[n-u]=0}}return s}static isValidBroadcast(e,t){let r=e.length,i=t.length;if(r>i)return!1;for(let a=1;a<=r;a++)if(e[r-a]!==1&&e[r-a]!==t[i-a])return!1;return!0}},O=class Mr{static size(t){return Mr.getSizeFromDimensionRange(t,0,t.length)}static convertShape(t,r=4){let i=t.length;if(i===0)return[];let a=new Array(i),n=i-1;for(;n>=0;){if(t[n]%r===0){a[n]=t[n]/r;break}if(r%t[n]!==0)throw new Error("cannot convert shape");a[n]=1,r/=t[n],n--}for(n--;n>=0;n--)a[n]=t[n];return a}static sizeFromDimension(t,r){if(r<0||r>t.length)throw new Error(`invalid dimension of ${r} for sizeFromDimension as Tensor has ${t.length} dimensions.`);return Mr.getSizeFromDimensionRange(t,r,t.length)}static sizeToDimension(t,r){if(r<0||r>t.length)throw new Error(`invalid dimension of ${r} for sizeToDimension as Tensor has ${t.length} dimensions.`);return Mr.getSizeFromDimensionRange(t,0,r)}static getSizeFromDimensionRange(t,r,i){let a=1;for(let n=r;n<i;n++){if(t[n]<0)throw new Error("cannot get valid size from specified dimension range. Most likely the range contains negative values in them.");a*=Number(t[n])}return a}static computeStrides(t){let r=t.length;if(r===0)return[];if(r===1)return[1];let i=new Array(r);i[r-1]=1,i[r-2]=t[r-1];for(let a=r-3;a>=0;--a)i[a]=i[a+1]*t[a+1];return i}static normalizeAxis(t,r){if(t<-r&&t>=r)throw new Error("unsupported axis for this operation.");return t<0?t+r:t}static normalizeAxes(t,r){return t.map(i=>this.normalizeAxis(i,r??t.length))}static sortBasedOnPerm(t,r){return r?r.map(i=>t[i]):t.slice().reverse()}static padShape(t,r){let i=t.length;return t.map((a,n)=>a+r[n]+r[n+i])}static areEqual(t,r){return t.length!==r.length?!1:t.every((i,a)=>i===r[a])}},Wr=class ar{static adjustPoolAttributes(t,r,i,a,n,s){if(!t&&i.length!==r.length-2)throw new Error("length of specified kernel shapes should be 2 less than length of input dimensions");if(t)for(let u=0;u<r.length-2;u++)u>=i.length?i.push(r[u+2]):i[u]=r[u+2];for(let u=0;u<i.length;u++)if(u<a.length){if(a[u]<0)throw new Error("strides should be greater than or equal to 1")}else a.push(1);for(let u=0;u<i.length;u++)if(u<n.length){if(n[u]<0)throw new Error("dilations should be greater than or equal to 1")}else n.push(1);for(let u=0;u<i.length*2;u++)if(u<s.length){if(s[u]<0)throw new Error("pad should be greater than or equal to 1")}else s.push(0);for(let u=0;u<i.length;u++){if(i[u]<=0)throw new Error("kernel shapes need to be greater than 0");if(s[u]>=i[u]||s[u+i.length]>=i[u])throw new Error("pads should be smaller than kernel")}}static adjustPadsBasedOnAutoPad(t,r,i,a,n,s,u){if(u){if(n.length!==2*(t.length-2))throw new Error("length of pads should be twice the length of data dimensions");if(r.length!==t.length-2)throw new Error("length of strides should be the length of data dimensions");if(a.length!==t.length-2)throw new Error("length of kernel shapes should be the length of data dimensions");for(let d=0;d<t.length-2;d++)ar.adjustPadAndReturnShape(t[d+(s?1:2)],r[d],i[d],a[d],n,d,d+t.length-2,u)}}static computePoolOutputShape(t,r,i,a,n,s,u){if(r.length<=0)throw new Error("input shape must be of size greater than 0");let d=[r[0],r[1]];return ar.computeShapeHelper(t,r,d,i,a,n,s,u),d}static computeConvOutputShape(t,r,i,a,n,s,u){if(t.length<=0||r.length<=0)throw new Error("invalid input tensor dims or invalid filter tensor dims");let d=[t[0],r[0]];return ar.computeShapeHelper(!1,t,d,i,a,n,s,u),d}static computeShapeHelper(t,r,i,a,n,s,u,d){if(t)for(let p=0;p<r.length-2;p++)i.push(1);else for(let p=0;p<r.length-2;p++)i.push(ar.adjustPadAndReturnShape(r[p+2],a[p],n[p],s[p],u,p,p+r.length-2,d))}static adjustPadAndReturnShape(t,r,i,a,n,s,u,d){let p=i*(a-1)+1;if(d&&d!=="NOTSET")switch(d){case"VALID":return n[s]=0,n[u]=0,Math.floor((t-p)/r+1);case"SAME_LOWER":case"SAME_UPPER":if(i!==1)throw new Error("Dilation not supported for SAME_UPPER or SAME_LOWER");{let m=((t+r-1)/r-1)*r+a-t;return n[s]=Math.floor(d==="SAME_LOWER"?(m+1)/2:m/2),n[u]=m-n[s],Math.floor((t+m-a)/r+1)}default:throw new Error("Unsupported AutoPad type")}else return Math.floor((t+n[s]+n[u]-p)/r+1)}},op=class{static getShapeOfGemmResult(e,t,r,i,a){if(e.length!==2||r.length!==2)throw new Error("shape need to be of size 2");let n,s,u;t?(n=e[1],s=e[0]):(n=e[0],s=e[1]);let d=-1;if(i?(u=r[0],d=1):(u=r[1],d=0),r[d]!==s)throw new Error("dimension mismatch");if(n<=0||u<=0||s<=0)throw new Error("invalid shape specified");if(a&&!Pt.isValidBroadcast(a,[n,u]))throw new Error("gemm: invalid bias shape for broadcast");return[n,u,s]}},up=-34028234663852886e22,lp=34028234663852886e22}),Pa,dp=P(()=>{J(),Pa=(e,t)=>new(Fr(t))(e)}),Ei,ma,zi,_o,Ci,wo,Ai,Oi,Ri,bo,pp,jg=P(()=>{J(),nt(),Ei=new Map([["float32",32],["float16",16],["int32",32],["uint32",32],["int64",64],["uint64",64],["int8",8],["uint8",8],["int4",4],["uint4",4]]),ma=(e,t)=>{if(t==="int32")return e;let r=Ei.get(t);if(!r)throw new Error(`WebNN backend does not support data type: ${t}`);let i=r/8;if(e.byteLength%i!==0)throw new Error(`Invalid Uint8Array length - must be a multiple of ${i}.`);let a=e.byteLength/i,n=new(Fr(t))(e.buffer,e.byteOffset,a);switch(t){case"int64":case"uint64":{let s=new Int32Array(a);for(let u=0;u<a;u++){let d=n[u];if(d>2147483647n||d<-2147483648n)throw new Error("Can not convert int64 data to int32 - value out of range.");s[u]=Number(d)}return new Uint8Array(s.buffer)}case"int8":case"uint8":case"uint32":{if(t==="uint32"&&n.some(u=>u>2147483647))throw new Error("Can not convert uint32 data to int32 - value out of range.");let s=Int32Array.from(n,Number);return new Uint8Array(s.buffer)}default:throw new Error(`Unsupported data conversion from ${t} to 'int32'`)}},zi=(e,t)=>{if(t==="int32")return e;if(e.byteLength%4!==0)throw new Error("Invalid Uint8Array length - must be a multiple of 4 (int32).");let r=e.byteLength/4,i=new Int32Array(e.buffer,e.byteOffset,r);switch(t){case"int64":{let a=BigInt64Array.from(i,BigInt);return new Uint8Array(a.buffer)}case"uint64":{if(i.some(n=>n<0))throw new Error("Can not convert int32 data to uin64 - negative value found.");let a=BigUint64Array.from(i,BigInt);return new Uint8Array(a.buffer)}case"int8":{if(i.some(n=>n<-128||n>127))throw new Error("Can not convert int32 data to int8 - value out of range.");let a=Int8Array.from(i,Number);return new Uint8Array(a.buffer)}case"uint8":{if(i.some(a=>a<0||a>255))throw new Error("Can not convert int32 data to uint8 - value out of range.");return Uint8Array.from(i,Number)}case"uint32":{if(i.some(n=>n<0))throw new Error("Can not convert int32 data to uint32 - negative value found.");let a=Uint32Array.from(i,Number);return new Uint8Array(a.buffer)}default:throw new Error(`Unsupported data conversion from 'int32' to ${t}`)}},_o=1,Ci=()=>_o++,wo=new Map([["int8","int32"],["uint8","int32"],["uint32","int32"],["int64","int32"]]),Ai=(e,t)=>{let r=Ei.get(e);if(!r)throw new Error(`WebNN backend does not support data type: ${e}`);return t.length>0?Math.ceil(t.reduce((i,a)=>i*a)*r/8):0},Oi=class{constructor(e){this.isDataConverted=!1;let{sessionId:t,context:r,tensor:i,dataType:a,shape:n,fallbackDataType:s}=e;this.sessionId=t,this.mlContext=r,this.mlTensor=i,this.dataType=a,this.tensorShape=n,this.fallbackDataType=s}get tensor(){return this.mlTensor}get type(){return this.dataType}get fallbackType(){return this.fallbackDataType}get shape(){return this.tensorShape}get byteLength(){return Ai(this.dataType,this.tensorShape)}destroy(){le("verbose",()=>"[WebNN] TensorWrapper.destroy"),this.mlTensor.destroy()}write(e){this.mlContext.writeTensor(this.mlTensor,e)}async read(e){if(this.fallbackDataType){let t=await this.mlContext.readTensor(this.mlTensor),r=zi(new Uint8Array(t),this.dataType);if(e){(e instanceof ArrayBuffer?new Uint8Array(e):new Uint8Array(e.buffer,e.byteOffset,e.byteLength)).set(r);return}else return r.buffer}else return e?this.mlContext.readTensor(this.mlTensor,e):this.mlContext.readTensor(this.mlTensor)}canReuseTensor(e,t,r){return this.mlContext===e&&this.dataType===t&&this.tensorShape.length===r.length&&this.tensorShape.every((i,a)=>i===r[a])}setIsDataConverted(e){this.isDataConverted=e}},Ri=class{constructor(e,t){this.tensorManager=e,this.wrapper=t}get tensorWrapper(){return this.wrapper}releaseTensor(){this.tensorWrapper&&(this.tensorManager.releaseTensor(this.tensorWrapper),this.wrapper=void 0)}async ensureTensor(e,t,r,i){let a=this.tensorManager.getMLContext(e),n=this.tensorManager.getMLOpSupportLimits(e),s;if(!n?.input.dataTypes.includes(t)){if(s=wo.get(t),!s||n?.input.dataTypes.includes(s))throw new Error(`WebNN backend does not support data type: ${t}`);le("verbose",()=>`[WebNN] TensorIdTracker.ensureTensor: fallback dataType from ${t} to ${s}`)}if(this.wrapper){if(this.wrapper.canReuseTensor(a,t,r))return this.wrapper.tensor;if(i){if(this.wrapper.byteLength!==Ai(t,r))throw new Error("Unable to copy data to tensor with different size.");this.activeUpload=new Uint8Array(await this.wrapper.read())}this.tensorManager.releaseTensor(this.wrapper)}let u=typeof MLTensorUsage>"u"?void 0:MLTensorUsage.READ|MLTensorUsage.WRITE;return this.wrapper=await this.tensorManager.getCachedTensor(e,t,r,u,!0,!0,s),i&&this.activeUpload&&(this.wrapper.write(this.activeUpload),this.activeUpload=void 0),this.wrapper.tensor}upload(e){let t=e;if(this.wrapper){if(this.wrapper.fallbackType)if(this.wrapper.fallbackType==="int32")t=ma(e,this.wrapper.type),this.wrapper.setIsDataConverted(!0);else throw new Error(`Unsupported fallback data type: ${this.wrapper.fallbackType}`);if(e.byteLength===this.wrapper.byteLength){this.wrapper.write(t);return}else le("verbose",()=>"Data size does not match tensor size. Releasing tensor."),this.releaseTensor()}this.activeUpload?this.activeUpload.set(t):this.activeUpload=new Uint8Array(t)}async download(e){if(this.activeUpload){let t=this.wrapper?.isDataConverted?zi(this.activeUpload,this.wrapper?.type):this.activeUpload;if(e){e instanceof ArrayBuffer?new Uint8Array(e).set(t):new Uint8Array(e.buffer,e.byteOffset,e.byteLength).set(t);return}else return t.buffer}if(!this.wrapper)throw new Error("Tensor has not been created.");return e?this.wrapper.read(e):this.wrapper.read()}},bo=class{constructor(e){this.backend=e,this.tensorTrackersById=new Map,this.freeTensors=[],this.externalTensors=new Set}getMLContext(e){let t=this.backend.getMLContext(e);if(!t)throw new Error("MLContext not found for session.");return t}getMLOpSupportLimits(e){return this.backend.getMLOpSupportLimits(e)}reserveTensorId(){let e=Ci();return this.tensorTrackersById.set(e,new Ri(this)),e}releaseTensorId(e){let t=this.tensorTrackersById.get(e);t&&(this.tensorTrackersById.delete(e),t.tensorWrapper&&this.releaseTensor(t.tensorWrapper))}async ensureTensor(e,t,r,i,a){le("verbose",()=>`[WebNN] TensorManager.ensureTensor {tensorId: ${t}, dataType: ${r}, shape: ${i}, copyOld: ${a}}`);let n=this.tensorTrackersById.get(t);if(!n)throw new Error("Tensor not found.");return n.ensureTensor(e,r,i,a)}upload(e,t){let r=this.tensorTrackersById.get(e);if(!r)throw new Error("Tensor not found.");r.upload(t)}async download(e,t){le("verbose",()=>`[WebNN] TensorManager.download {tensorId: ${e}, dstBuffer: ${t?.byteLength}}`);let r=this.tensorTrackersById.get(e);if(!r)throw new Error("Tensor not found.");return r.download(t)}releaseTensorsForSession(e){for(let t of this.freeTensors)t.sessionId===e&&t.destroy();this.freeTensors=this.freeTensors.filter(t=>t.sessionId!==e)}registerTensor(e,t,r,i){let a=this.getMLContext(e),n=Ci(),s=new Oi({sessionId:e,context:a,tensor:t,dataType:r,shape:i});return this.tensorTrackersById.set(n,new Ri(this,s)),this.externalTensors.add(s),n}async getCachedTensor(e,t,r,i,a,n,s){let u=this.getMLContext(e);for(let[p,m]of this.freeTensors.entries())if(m.canReuseTensor(u,t,r)){le("verbose",()=>`[WebNN] Reusing tensor {dataType: ${t}, ${s?`fallbackDataType: ${s},`:""} shape: ${r}`);let h=this.freeTensors.splice(p,1)[0];return h.sessionId=e,h}le("verbose",()=>`[WebNN] MLContext.createTensor {dataType: ${t}, ${s?`fallbackDataType: ${s},`:""} shape: ${r}}`);let d=await u.createTensor({dataType:s??t,shape:r,dimensions:r,usage:i,writable:a,readable:n});return new Oi({sessionId:e,context:u,tensor:d,dataType:t,shape:r,fallbackDataType:s})}releaseTensor(e){this.externalTensors.has(e)&&this.externalTensors.delete(e),this.freeTensors.push(e)}},pp=(...e)=>new bo(...e)}),Qt,$o,cp,Kg=P(()=>{J(),Ot(),dp(),jg(),nt(),Qt=new Map([[1,"float32"],[10,"float16"],[6,"int32"],[12,"uint32"],[7,"int64"],[13,"uint64"],[22,"int4"],[21,"uint4"],[3,"int8"],[2,"uint8"],[9,"uint8"]]),$o=(e,t)=>{if(e===t)return!0;if(e===void 0||t===void 0)return!1;let r=Object.keys(e).sort(),i=Object.keys(t).sort();return r.length===i.length&&r.every((a,n)=>a===i[n]&&e[a]===t[a])},cp=class{constructor(e){this.tensorManager=pp(this),this.mlContextBySessionId=new Map,this.sessionIdsByMLContext=new Map,this.mlContextCache=[],this.sessionGraphInputs=new Map,this.sessionGraphOutputs=new Map,this.temporaryGraphInputs=[],this.temporaryGraphOutputs=[],this.temporarySessionTensorIds=new Map,this.mlOpSupportLimitsBySessionId=new Map,Ua(e.logLevel,!!e.debug)}get currentSessionId(){if(this.activeSessionId===void 0)throw new Error("No active session");return this.activeSessionId}onRunStart(e){le("verbose",()=>`[WebNN] onRunStart {sessionId: ${e}}`),this.activeSessionId=e}onRunEnd(e){le("verbose",()=>`[WebNN] onRunEnd {sessionId: ${e}}`);let t=this.temporarySessionTensorIds.get(e);if(t){for(let r of t)le("verbose",()=>`[WebNN] releasing temporary tensor {tensorId: ${r}}`),this.tensorManager.releaseTensorId(r);this.temporarySessionTensorIds.delete(e),this.activeSessionId=void 0}}async createMLContext(e){if(e instanceof GPUDevice){let r=this.mlContextCache.findIndex(i=>i.gpuDevice===e);if(r!==-1)return this.mlContextCache[r].mlContext;{let i=await navigator.ml.createContext(e);return this.mlContextCache.push({gpuDevice:e,mlContext:i}),i}}else if(e===void 0){let r=this.mlContextCache.findIndex(i=>i.options===void 0&&i.gpuDevice===void 0);if(r!==-1)return this.mlContextCache[r].mlContext;{let i=await navigator.ml.createContext();return this.mlContextCache.push({mlContext:i}),i}}let t=this.mlContextCache.findIndex(r=>$o(r.options,e));if(t!==-1)return this.mlContextCache[t].mlContext;{let r=await navigator.ml.createContext(e);return this.mlContextCache.push({options:e,mlContext:r}),r}}registerMLContext(e,t){this.mlContextBySessionId.set(e,t);let r=this.sessionIdsByMLContext.get(t);r||(r=new Set,this.sessionIdsByMLContext.set(t,r)),r.add(e),this.mlOpSupportLimitsBySessionId.has(e)||this.mlOpSupportLimitsBySessionId.set(e,t.opSupportLimits()),this.temporaryGraphInputs.length>0&&(this.sessionGraphInputs.set(e,this.temporaryGraphInputs),this.temporaryGraphInputs=[]),this.temporaryGraphOutputs.length>0&&(this.sessionGraphOutputs.set(e,this.temporaryGraphOutputs),this.temporaryGraphOutputs=[])}onReleaseSession(e){this.sessionGraphInputs.delete(e),this.sessionGraphOutputs.delete(e);let t=this.mlContextBySessionId.get(e);if(!t)return;this.tensorManager.releaseTensorsForSession(e),this.mlContextBySessionId.delete(e),this.mlOpSupportLimitsBySessionId.delete(e);let r=this.sessionIdsByMLContext.get(t);if(r.delete(e),r.size===0){this.sessionIdsByMLContext.delete(t);let i=this.mlContextCache.findIndex(a=>a.mlContext===t);i!==-1&&this.mlContextCache.splice(i,1)}}getMLContext(e){return this.mlContextBySessionId.get(e)}getMLOpSupportLimits(e){return this.mlOpSupportLimitsBySessionId.get(e)}reserveTensorId(){return this.tensorManager.reserveTensorId()}releaseTensorId(e){le("verbose",()=>`[WebNN] releaseTensorId {tensorId: ${e}}`),this.tensorManager.releaseTensorId(e)}async ensureTensor(e,t,r,i,a){let n=Qt.get(r);if(!n)throw new Error(`Unsupported ONNX data type: ${r}`);return this.tensorManager.ensureTensor(e??this.currentSessionId,t,n,i,a)}async createTemporaryTensor(e,t,r){le("verbose",()=>`[WebNN] createTemporaryTensor {onnxDataType: ${t}, shape: ${r}}`);let i=Qt.get(t);if(!i)throw new Error(`Unsupported ONNX data type: ${t}`);let a=this.tensorManager.reserveTensorId();await this.tensorManager.ensureTensor(e,a,i,r,!1);let n=this.temporarySessionTensorIds.get(e);return n?n.push(a):this.temporarySessionTensorIds.set(e,[a]),a}uploadTensor(e,t){if(!ge().shouldTransferToMLTensor)throw new Error("Trying to upload to a MLTensor while shouldTransferToMLTensor is false");le("verbose",()=>`[WebNN] uploadTensor {tensorId: ${e}, data: ${t.byteLength}}`),this.tensorManager.upload(e,t)}async downloadTensor(e,t){return this.tensorManager.download(e,t)}createMLTensorDownloader(e,t){return async()=>{let r=await this.tensorManager.download(e);return Pa(r,t)}}registerMLTensor(e,t,r,i){let a=Qt.get(r);if(!a)throw new Error(`Unsupported ONNX data type: ${r}`);let n=this.tensorManager.registerTensor(e,t,a,i);return le("verbose",()=>`[WebNN] registerMLTensor {tensor: ${t}, dataType: ${a}, dimensions: ${i}} -> {tensorId: ${n}}`),n}registerMLConstant(e,t,r,i,a,n,s=!1){if(!n)throw new Error("External mounted files are not available.");let u=e;e.startsWith("./")&&(u=e.substring(2));let d=n.get(u);if(!d)throw new Error(`File with name ${u} not found in preloaded files.`);if(t+r>d.byteLength)throw new Error("Out of bounds: data offset and length exceed the external file data size.");let p=d.slice(t,t+r).buffer,m;switch(a.dataType){case"float32":m=new Float32Array(p);break;case"float16":m=typeof Float16Array<"u"&&Float16Array.from?new Float16Array(p):new Uint16Array(p);break;case"int32":m=new Int32Array(p);break;case"uint32":m=new Uint32Array(p);break;case"int64":if(s){let h=ma(new Uint8Array(p),"int64");m=new Int32Array(h.buffer),a.dataType="int32"}else m=new BigInt64Array(p);break;case"uint64":m=new BigUint64Array(p);break;case"int8":m=new Int8Array(p);break;case"int4":case"uint4":case"uint8":m=new Uint8Array(p);break;default:throw new Error(`Unsupported data type: ${a.dataType} in creating WebNN Constant from external data.`)}return le("verbose",()=>`[WebNN] registerMLConstant {dataType: ${a.dataType}, shape: ${a.shape}}} ${s?"(Note: it was int64 data type and registered to int32 as workaround)":""}`),i.constant(a,m)}registerGraphInput(e){this.temporaryGraphInputs.push(e)}registerGraphOutput(e){this.temporaryGraphOutputs.push(e)}isGraphInput(e,t){let r=this.sessionGraphInputs.get(e);return r?r.includes(t):!1}isGraphOutput(e,t){let r=this.sessionGraphOutputs.get(e);return r?r.includes(t):!1}isGraphInputOutputTypeSupported(e,t,r=!0){let i=Qt.get(Tt(t)),a=this.mlOpSupportLimitsBySessionId.get(e);return typeof i>"u"?!1:r?!!a?.input.dataTypes.includes(i):!!a?.output.dataTypes.includes(i)}flush(){}}}),qa=P(()=>{}),Bi,kr,Ir,vo,xo,Ni,ga,So,hp,Qg=P(()=>{nt(),qa(),Bi=new Map([[64,250],[128,200],[256,200],[512,200],[2048,230],[4096,200],[8192,50],[16384,50],[32768,50],[65536,50],[131072,50],[262144,50],[524288,50],[1048576,50],[2097152,30],[4194304,20],[8388608,10],[12582912,10],[16777216,10],[26214400,15],[33554432,22],[44236800,2],[58982400,6],[67108864,6],[134217728,6],[167772160,6]]),kr=[],Ir=e=>Math.ceil(Number(e)/16)*16,vo=e=>{for(let t=0;t<kr.length;t++){let r=kr[t];if(e<=r)return r}return Math.ceil(e/16)*16},xo=1,Ni=()=>xo++,ga=async(e,t,r,i)=>{let a=Ir(r),n=e.device.createBuffer({size:a,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});try{let s=e.getCommandEncoder();e.endComputePass(),s.copyBufferToBuffer(t,0,n,0,a),e.flush(),await n.mapAsync(GPUMapMode.READ);let u=n.getMappedRange();if(i){let d=i();return d.set(new Uint8Array(u,0,r)),d}else return new Uint8Array(u.slice(0,r))}finally{n.destroy()}},So=class{constructor(e){this.backend=e,this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.buffersPending=[],this.capturedPendingBuffers=new Map;for(let[t]of Bi)kr.push(t),this.freeBuffers.set(t,[]),this.freeUniformBuffers.set(t,[]);this.sessionCount=0}upload(e,t){let r=t.buffer,i=t.byteOffset,a=t.byteLength,n=Ir(a),s=this.storageCache.get(e);if(!s)throw new Error("gpu data for uploading does not exist");if(Number(s.originalSize)!==a)throw new Error(`inconsistent data size. gpu data size=${s.originalSize}, data size=${a}`);let u=this.backend.device.createBuffer({mappedAtCreation:!0,size:n,usage:GPUBufferUsage.MAP_WRITE|GPUBufferUsage.COPY_SRC}),d=u.getMappedRange();new Uint8Array(d).set(new Uint8Array(r,i,a)),u.unmap();let p=this.backend.device.createCommandEncoder();p.copyBufferToBuffer(u,0,s.gpuData.buffer,0,n),this.backend.device.queue.submit([p.finish()]),u.destroy(),le("verbose",()=>`[WebGPU] GpuDataManager.upload(id=${e})`)}memcpy(e,t){let r=this.storageCache.get(e);if(!r)throw new Error("source gpu data for memcpy does not exist");let i=this.storageCache.get(t);if(!i)throw new Error("destination gpu data for memcpy does not exist");if(r.originalSize!==i.originalSize)throw new Error("inconsistent source and destination gpu data size");let a=Ir(r.originalSize),n=this.backend.getCommandEncoder();this.backend.endComputePass(),n.copyBufferToBuffer(r.gpuData.buffer,0,i.gpuData.buffer,0,a)}registerExternalBuffer(e,t,r){let i;if(r){if(i=r[0],e===r[1])return le("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${i}, buffer is the same, skip.`),i;if(this.backend.capturedCommandList.has(this.backend.currentSessionId))throw new Error(`Registering a different external buffer under graph capture mode is not supported yet.
             Please use the previous external buffer!`)}else i=Ni();return this.storageCache.set(i,{gpuData:{id:i,type:0,buffer:e},originalSize:t}),le("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${i}, registered.`),i}unregisterExternalBuffer(e){e!==void 0&&(this.storageCache.delete(e),le("verbose",()=>`[WebGPU] GpuDataManager.unregisterExternalBuffer() => id=${e}`))}create(e,t=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST){let r=vo(e),i,a=(t&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE,n=(t&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM;if(a||n){let u=(a?this.freeBuffers:this.freeUniformBuffers).get(r);u?u.length>0?i=u.pop():i=this.backend.device.createBuffer({size:r,usage:t}):i=this.backend.device.createBuffer({size:r,usage:t})}else i=this.backend.device.createBuffer({size:r,usage:t});let s={id:Ni(),type:0,buffer:i};return this.storageCache.set(s.id,{gpuData:s,originalSize:Number(e)}),le("verbose",()=>`[WebGPU] GpuDataManager.create(size=${e}) => id=${s.id}`),s}get(e){return this.storageCache.get(e)?.gpuData}release(e){let t=typeof e=="bigint"?Number(e):e,r=this.storageCache.get(t);if(!r){if(this.storageCache.size===0)return 0;throw new Error("releasing data does not exist")}return le("verbose",()=>`[WebGPU] GpuDataManager.release(id=${t}), gpuDataId=${r.gpuData.id}`),this.storageCache.delete(t),this.buffersPending.push(r.gpuData.buffer),r.originalSize}async download(e,t){let r=this.storageCache.get(Number(e));if(!r)throw new Error("data does not exist");await ga(this.backend,r.gpuData.buffer,r.originalSize,t)}refreshPendingBuffers(){if(this.buffersPending.length!==0)if(this.backend.sessionStatus==="default"){for(let e of this.buffersPending){let t=Bi.get(e.size);if((e.usage&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE){let r=this.freeBuffers.get(e.size)||[];t===void 0||r.length>=t?e.destroy():r.push(e)}else if((e.usage&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM){let r=this.freeUniformBuffers.get(e.size)||[];t===void 0||r.length>=t?e.destroy():r.push(e)}else e.destroy()}this.buffersPending=[]}else{let e=this.capturedPendingBuffers.get(this.backend.currentSessionId);e||(e=[],this.capturedPendingBuffers.set(this.backend.currentSessionId,e));for(let t of this.buffersPending)e.push(t);this.buffersPending=[]}}dispose(){this.freeBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.freeUniformBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache.forEach(e=>{e.gpuData.buffer.destroy()}),this.capturedPendingBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.capturedPendingBuffers=new Map}onCreateSession(){this.sessionCount+=1}onReleaseSession(e){let t=this.capturedPendingBuffers.get(e);t&&(t.forEach(r=>{r.destroy()}),this.capturedPendingBuffers.delete(e)),this.sessionCount-=1,this.sessionCount===0&&(le("warning",()=>"[WebGPU] Clearing webgpu buffer cache"),this.storageCache.forEach(r=>{r.gpuData.buffer.destroy()}),this.storageCache=new Map)}},hp=(...e)=>new So(...e)}),To,he,ve=P(()=>{To=class{constructor(e){Object.assign(this,e)}get cacheKey(){return this.key||(this.key=Object.getOwnPropertyNames(this).sort().map(e=>`${this[e]}`).join(";")),this.key}},he=e=>new To(e)}),qt,Er,Te,Ee,K,$e,ya,Ut,mt,j,Zt,N,F,fp,Wa,ko,mp,ie=P(()=>{J(),re(),qt=64,Er=(e,t)=>{if(t===3)throw new Error("vec3 has same alignment as vec4, use vec4 instead");switch(Number(e)){case 10:return t>1?`vec${t}<f16>`:"f16";case 1:return t>1?`vec${t}<f32>`:"f32";case 6:return t>1?`vec${t}<i32>`:"i32";case 12:return t>1?`vec${t}<u32>`:"u32";case 7:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","i32"];case 13:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","u32"];case 9:if(t!==4)throw new Error("bool must be vec4");return["u32","vec4<bool>"];case 22:return"i32";case 21:return"u32";default:throw new Error(`Unknown data type: ${e}`)}},Te=(e,t=1)=>{let r=Er(e,t);return typeof r=="string"?r:r[0]},Ee=(e,t=1)=>{let r=Er(e,t);return typeof r=="string"?r:r[1]},K=(...e)=>{let t=[];return e.forEach(r=>{r.length!==0&&t.push({type:12,data:r},{type:12,data:O.computeStrides(r)})}),t},$e=e=>e%4===0?4:e%2===0?2:1,ya=(e="f32",t,r="0")=>!t||t===1?`${e}(${r})`:`vec${t}<${e}>(${r})`,Ut=(e,t,r)=>e==="f32"?r:t===1?`f32(${r})`:`vec${t}<f32>(${r})`,mt=(e,t)=>t===4?`(${e}.x + ${e}.y + ${e}.z + ${e}.w)`:t===2?`(${e}.x + ${e}.y)`:t===3?`(${e}.x + ${e}.y + ${e}.z)`:e,j=(e,t,r,i)=>e.startsWith("uniforms.")&&r>4?typeof t=="string"?i==="f16"?`${e}[(${t}) / 8][(${t}) % 8 / 4][(${t}) % 8 % 4]`:`${e}[(${t}) / 4][(${t}) % 4]`:i==="f16"?`${e}[${Math.floor(t/8)}][${Math.floor(t%8/4)}][${t%8%4}]`:`${e}[${Math.floor(t/4)}][${t%4}]`:r>1?`${e}[${t}]`:e,Zt=(e,t,r,i,a)=>{let n=typeof r=="number",s=n?r:r.length,u=[...new Array(s).keys()],d=s<2?"u32":s<=4?`vec${s}<u32>`:`array<u32, ${s}>`,p=Er(t,a),m=typeof p=="string"?p:p[1],h=typeof p=="string"?p:p[0],g={indices:d,value:m,storage:h,tensor:t},y=M=>typeof M=="string"?M:`${M}u`,_={offsetToIndices:!1,indicesToOffset:!1,broadcastedIndicesToOffset:!1,set:!1,setByIndices:!1,get:!1,getByIndices:!1},$=n?"uniforms.":"",T=`${$}${e}_shape`,x=`${$}${e}_strides`,w="";for(let M=0;M<s-1;M++)w+=`
    let dim${M} = current / ${j(x,M,s)};
    let rest${M} = current % ${j(x,M,s)};
    indices[${M}] = dim${M};
    current = rest${M};
    `;w+=`indices[${s-1}] = current;`;let I=s<2?"":`
  fn o2i_${e}(offset: u32) -> ${g.indices} {
    var indices: ${g.indices};
    var current = offset;
    ${w}
    return indices;
  }`,S=M=>(_.offsetToIndices=!0,s<2?M:`o2i_${e}(${M})`),E=[];if(s>=2)for(let M=s-1;M>=0;M--)E.push(`${j(x,M,s)} * (indices[${M}])`);let C=s<2?"":`
  fn i2o_${e}(indices: ${g.indices}) -> u32 {
    return ${E.join("+")};
  }`,A=M=>(_.indicesToOffset=!0,s<2?M:`i2o_${e}(${M})`),v=(...M)=>s===0?"0u":`${g.indices}(${M.map(y).join(",")})`,U=(M,L)=>s<2?`${M}`:`${j(M,L,s)}`,q=(M,L,te)=>s<2?`${M}=${te};`:`${j(M,L,s)}=${te};`,Y={},H=(M,L)=>{_.broadcastedIndicesToOffset=!0;let te=`${L.name}broadcastedIndicesTo${e}Offset`;if(te in Y)return`${te}(${M})`;let oe=[];for(let Ae=s-1;Ae>=0;Ae--){let Oe=L.indicesGet("outputIndices",Ae+L.rank-s);oe.push(`${U(x,Ae)} * (${Oe} % ${U(T,Ae)})`)}return Y[te]=`fn ${te}(outputIndices: ${L.type.indices}) -> u32 {
             return ${oe.length>0?oe.join("+"):"0u"};
           }`,`${te}(${M})`},Q=(M,L)=>(()=>{if(g.storage===g.value)return`${e}[${M}]=${L};`;if(g.storage==="vec2<u32>"&&g.value==="i32")return`${e}[${M}]=vec2<u32>(u32(${L}), select(0u, 0xFFFFFFFFu, ${L} < 0));`;if(g.storage==="vec2<u32>"&&g.value==="u32")return`${e}[${M}]=vec2<u32>(u32(${L}), 0u);`;if(g.storage==="u32"&&g.value==="vec4<bool>")return`${e}[${M}]=dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(${L}));`;throw new Error(`not supported combination of storage type ${g.storage} and value type ${g.value} yet`)})(),R=M=>(()=>{if(g.storage===g.value)return`${e}[${M}]`;if(g.storage==="vec2<u32>"&&g.value==="i32")return`i32(${e}[${M}].x)`;if(g.storage==="vec2<u32>"&&g.value==="u32")return`u32(${e}[${M}].x)`;if(g.storage==="u32"&&g.value==="vec4<bool>")return`vec4<bool>(bool(${e}[${M}] & 0xFFu), bool(${e}[${M}] & 0xFF00u), bool(${e}[${M}] & 0xFF0000u), bool(${e}[${M}] & 0xFF000000u))`;throw new Error(`not supported combination of storage type ${g.storage} and value type ${g.value} yet`)})(),D=s<2?"":`
  fn get_${e}ByIndices(indices: ${g.indices}) -> ${m} {
    return ${R(`i2o_${e}(indices)`)};
  }`,G=s<2?"":(()=>{let M=u.map(te=>`d${te}: u32`).join(", "),L=u.map(te=>`d${te}`).join(", ");return`
  fn get_${e}(${M}) -> ${m} {
    return get_${e}ByIndices(${v(L)});
  }`})(),ee=(...M)=>{if(M.length!==s)throw new Error(`indices length must be ${s}`);let L=M.map(y).join(",");return s===0?R("0u"):s===1?R(L[0]):(_.get=!0,_.getByIndices=!0,_.indicesToOffset=!0,`get_${e}(${L})`)},Z=M=>s<2?R(M):(_.getByIndices=!0,_.indicesToOffset=!0,`get_${e}ByIndices(${M})`),X=s<2?"":`
  fn set_${e}ByIndices(indices: ${g.indices}, value: ${m}) {
    ${Q(`i2o_${e}(indices)`,"value")}
  }`,de=s<2?"":(()=>{let M=u.map(te=>`d${te}: u32`).join(", "),L=u.map(te=>`d${te}`).join(", ");return`
  fn set_${e}(${M}, value: ${m}) {
    set_${e}ByIndices(${v(L)}, value);
  }`})();return{impl:()=>{let M=[],L=!1;return _.offsetToIndices&&(M.push(I),L=!0),_.indicesToOffset&&(M.push(C),L=!0),_.broadcastedIndicesToOffset&&(Object.values(Y).forEach(te=>M.push(te)),L=!0),_.set&&(M.push(de),L=!0),_.setByIndices&&(M.push(X),L=!0),_.get&&(M.push(G),L=!0),_.getByIndices&&(M.push(D),L=!0),!n&&L&&M.unshift(`const ${T} = ${g.indices}(${r.join(",")});`,`const ${x} = ${g.indices}(${O.computeStrides(r).join(",")});`),M.join(`
`)},type:g,offsetToIndices:S,indicesToOffset:A,broadcastedIndicesToOffset:H,indices:v,indicesGet:U,indicesSet:q,set:(...M)=>{if(M.length!==s+1)throw new Error(`indices length must be ${s}`);let L=M[s];if(typeof L!="string")throw new Error("value must be string");let te=M.slice(0,s).map(y).join(",");return s===0?Q("0u",L):s===1?Q(te[0],L):(_.set=!0,_.setByIndices=!0,_.indicesToOffset=!0,`set_${e}(${te}, ${L})`)},setByOffset:Q,setByIndices:(M,L)=>s<2?Q(M,L):(_.setByIndices=!0,_.indicesToOffset=!0,`set_${e}ByIndices(${M}, ${L});`),get:ee,getByOffset:R,getByIndices:Z,usage:i,name:e,strides:x,shape:T,rank:s}},N=(e,t,r,i=1)=>Zt(e,t,r,"input",i),F=(e,t,r,i=1)=>Zt(e,t,r,"output",i),fp=(e,t,r)=>Zt(e,t,r,"atomicOutput",1),Wa=(e,t,r,i=1)=>Zt(e,t,r,"internal",i),ko=class{constructor(e,t){this.normalizedDispatchGroup=e,this.limits=t,this.internalVariables=[],this.variables=[],this.uniforms=[],this.variableIndex=0}guardAgainstOutOfBoundsWorkgroupSizes(e){return`if (global_idx >= ${typeof e=="number"?`${e}u`:e}) { return; }`}mainStart(e=qt){let t=typeof e=="number"?e:e[0],r=typeof e=="number"?1:e[1],i=typeof e=="number"?1:e[2];if(t>this.limits.maxComputeWorkgroupSizeX||r>this.limits.maxComputeWorkgroupSizeY||i>this.limits.maxComputeWorkgroupSizeZ)throw new Error(`workgroup size [${t}, ${r}, ${i}] exceeds the maximum workgroup size [${this.limits.maxComputeWorkgroupSizeX}, ${this.limits.maxComputeWorkgroupSizeY}, ${this.limits.maxComputeWorkgroupSizeZ}].`);if(t*r*i>this.limits.maxComputeInvocationsPerWorkgroup)throw new Error(`workgroup size [${t}, ${r}, ${i}] exceeds the maximum workgroup invocations ${this.limits.maxComputeInvocationsPerWorkgroup}.`);let a=this.normalizedDispatchGroup[1]===1&&this.normalizedDispatchGroup[2]===1,n=a?`@builtin(global_invocation_id) global_id : vec3<u32>,
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(local_invocation_index) local_idx : u32,
    @builtin(local_invocation_id) local_id : vec3<u32>`:`@builtin(global_invocation_id) global_id : vec3<u32>,
                                             @builtin(local_invocation_id) local_id : vec3<u32>,
    @builtin(local_invocation_index) local_idx : u32,
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(num_workgroups) num_workgroups : vec3<u32>`,s=a?`let global_idx = global_id.x;
         let workgroup_index = workgroup_id.x;`:`let workgroup_index = workgroup_id.z * num_workgroups[0] * num_workgroups[1] +
             workgroup_id.y * num_workgroups[0] + workgroup_id.x;
         let global_idx = workgroup_index * ${t*r*i}u + local_idx;`;return`@compute @workgroup_size(${t}, ${r}, ${i})
  fn main(${n}) {
    ${s}
  `}appendVariableUniforms(e){e.rank!==0&&(e.shape.startsWith("uniforms.")&&this.uniforms.push({name:e.shape.replace("uniforms.",""),type:"u32",length:e.rank}),e.strides.startsWith("uniforms.")&&this.uniforms.push({name:e.strides.replace("uniforms.",""),type:"u32",length:e.rank}))}declareVariable(e,t){if(e.usage==="internal")throw new Error("cannot use internal variable with declareVariable(). use registerInternalVariables() instead.");this.variables.push(e),this.appendVariableUniforms(e);let r=e.usage==="input"?"read":"read_write",i=e.usage==="atomicOutput"?"atomic<i32>":e.type.storage;return`@group(0) @binding(${t}) var<storage, ${r}> ${e.name}: array<${i}>;`}declareVariables(...e){return e.map(t=>this.declareVariable(t,this.variableIndex++)).join(`
`)}registerInternalVariable(e){if(e.usage!=="internal")throw new Error("cannot use input or output variable with registerInternalVariable(). use declareVariables() instead.");this.internalVariables.push(e),this.appendVariableUniforms(e)}registerInternalVariables(...e){return e.forEach(t=>this.registerInternalVariable(t)),this}registerUniform(e,t,r=1){return this.uniforms.push({name:e,type:t,length:r}),this}registerUniforms(e){return this.uniforms=this.uniforms.concat(e),this}uniformDeclaration(){if(this.uniforms.length===0)return"";let e=[];for(let{name:t,type:r,length:i}of this.uniforms)if(i&&i>4)r==="f16"?e.push(`@align(16) ${t}:array<mat2x4<${r}>, ${Math.ceil(i/8)}>`):e.push(`${t}:array<vec4<${r}>, ${Math.ceil(i/4)}>`);else{let a=i==null||i===1?r:`vec${i}<${r}>`;e.push(`${t}:${a}`)}return`
      struct Uniforms { ${e.join(", ")} };
      @group(0) @binding(${this.variableIndex}) var<uniform> uniforms: Uniforms;`}get additionalImplementations(){return this.uniformDeclaration()+this.variables.map(e=>e.impl()).join(`
`)+this.internalVariables.map(e=>e.impl()).join(`
`)}get variablesInfo(){if(this.uniforms.length===0)return;let e=t=>[12,10,1,6][["u32","f16","f32","i32"].indexOf(t)];return this.uniforms.map(t=>[e(t.type),t.length??1])}},mp=(e,t)=>new ko(e,t)}),Io,Mi,Eo,zo,Co,Ao,Ne,gp,yp,gt=P(()=>{J(),re(),ve(),ie(),Io=(e,t)=>{if(!e||e.length!==1)throw new Error("Transpose requires 1 input.");if(t.length!==0&&t.length!==e[0].dims.length)throw new Error(`perm size ${t.length} does not match input rank ${e[0].dims.length}`)},Mi=(e,t)=>t.length!==0?t:[...new Array(e).keys()].reverse(),Eo=(e,t)=>O.sortBasedOnPerm(e,Mi(e.length,t)),zo=(e,t,r,i)=>{let a=`fn perm(i: ${i.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`;for(let n=0;n<t;++n)a+=`a[${e[n]}]=i[${n}];`;return a+="return a;}"},Co=(e,t)=>{let r=[],i=[];for(let a=0;a<e.length;++a)e[a]!==1&&r.push(e[a]),e[t[a]]!==1&&i.push(t[a]);return{newShape:r,newPerm:i}},Ao=(e,t)=>{let r=0;for(let i=0;i<e.length;++i)if(t[e[i]]!==1){if(e[i]<r)return!1;r=e[i]}return!0},Ne=(e,t)=>{let r=e.dataType,i=e.dims.length,a=Mi(i,t),n=Eo(e.dims,a),s=e.dims,u=n,d=i<2||Ao(a,e.dims),p;if(d)return p=_=>{let $=N("input",r,s,4),T=F("output",r,u,4);return`
  ${_.registerUniform("output_size","u32").declareVariables($,T)}
  ${_.mainStart()}
    ${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    output[global_idx] = input[global_idx];
  }`},{name:"TransposeCopy",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let _=O.size(n);return{outputs:[{dims:n,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(_/64/4)},programUniforms:[{type:12,data:Math.ceil(_/4)}]}},getShaderSource:p};let{newShape:m,newPerm:h}=Co(e.dims,a),g=O.areEqual(h,[2,3,1]),y=O.areEqual(h,[3,1,2]);if(m.length===2||g||y){s=g?[m[0],m[1]*m[2]]:y?[m[0]*m[1],m[2]]:m,u=[s[1],s[0]];let _=16;return p=$=>{let T=N("a",r,s.length),x=F("output",r,u.length);return`
  ${$.registerUniform("output_size","u32").declareVariables(T,x)}
  var<workgroup> tile : array<array<${x.type.value}, ${_+1}>, ${_}>;
  ${$.mainStart([_,_,1])}
    let stride = (uniforms.output_shape[1] - 1) / ${_} + 1;
    let workgroup_id_x = workgroup_index % stride;
    let workgroup_id_y = workgroup_index / stride;
    let input_col = workgroup_id_y * ${_}u + local_id.x;
    let input_row = workgroup_id_x * ${_}u + local_id.y;
    if (input_row < uniforms.a_shape[0] && input_col < uniforms.a_shape[1]) {
      tile[local_id.y][local_id.x] = ${T.getByIndices(`${T.type.indices}(input_row, input_col)`)};
    }
    workgroupBarrier();

    let output_col = workgroup_id_x * ${_}u + local_id.x;
    let output_row = workgroup_id_y * ${_}u + local_id.y;
    if (output_row < uniforms.output_shape[0] && output_col < uniforms.output_shape[1]) {
      ${x.setByIndices(`${x.type.indices}(output_row, output_col)`,"tile[local_id.x][local_id.y]")}
    }
  }`},{name:"TransposeShared",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let $=O.size(n);return{outputs:[{dims:n,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(u[1]/_),y:Math.ceil(u[0]/_)},programUniforms:[{type:12,data:$},...K(s,u)]}},getShaderSource:p}}return p=_=>{let $=N("a",r,s.length),T=F("output",r,u.length);return`
  ${_.registerUniform("output_size","u32").declareVariables($,T)}

  ${zo(a,i,$,T)}

  ${_.mainStart()}
    ${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${T.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${T.setByOffset("global_idx",$.getByIndices("aIndices"))}
  }`},{name:"Transpose",shaderCache:{hint:`${t}`,inputDependencies:["rank"]},getRunData:()=>{let _=O.size(n);return{outputs:[{dims:n,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(_/64)},programUniforms:[{type:12,data:_},...K(s,u)]}},getShaderSource:p}},gp=(e,t)=>{Io(e.inputs,t.perm),e.compute(Ne(e.inputs[0],t.perm))},yp=e=>he({perm:e.perm})}),Oo,Ro,Bo,No,Mo,Do,Uo,Po,qo,Wo,We,_p,wp,bp,$p,vp,xp,Sp,Tp,kp,Ip,Zg=P(()=>{J(),re(),ie(),La(),gt(),Oo={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate * candidate",logSumExp:"bestValue + exp(candidate)",l1:"bestValue + abs(candidate)",l2:"bestValue + candidate * candidate",logSum:"bestValue + candidate"},Ro={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate",logSumExp:"bestValue + candidate",l1:"bestValue + candidate",l2:"bestValue + candidate",logSum:"bestValue + candidate"},Bo={max:"_A[offset]",min:"_A[offset]",mean:"0",sum:"0",prod:"1",sumSquare:"0",logSumExp:"0",l1:"0",l2:"0",logSum:"0"},No={max:"bestValue",min:"bestValue",sum:"bestValue",prod:"bestValue",sumSquare:"bestValue",logSumExp:"log(bestValue)",l1:"bestValue",l2:"sqrt(bestValue)",logSum:"log(bestValue)"},Mo=(e,t)=>{let r=[];for(let i=t-e;i<t;++i)r.push(i);return r},Do=(e,t)=>{let r=[],i=e.length;for(let n=0;n<i;n++)t.indexOf(n)===-1&&r.push(e[n]);let a=t.map(n=>e[n]);return[r,a]},Uo=(e,t)=>{let r=e.length+t.length,i=[],a=0;for(let n=0;n<r;n++)t.indexOf(n)===-1?i.push(e[a++]):i.push(1);return i},Po=(e,t)=>{for(let r=0;r<e.length;++r)if(e[e.length-r-1]!==t-1-r)return!1;return!0},qo=(e,t)=>{let r=[];if(!Po(e,t)){for(let i=0;i<t;++i)e.indexOf(i)===-1&&r.push(i);e.forEach(i=>r.push(i))}return r},Wo=(e,t,r,i,a,n,s)=>{let u=r[0].dims,d=O.size(n),p=O.size(s),m=N("_A",r[0].dataType,u),h=F("output",a,n),g=64;d===1&&(g=256);let y=`
          var<workgroup> aBestValues : array<f32, ${g}>;
       `,_=$=>`
        ${$.registerUniform("reduceSize","u32").declareVariables(m,h)}
        ${y}
        fn DIV_CEIL(a : u32, b : u32) -> u32 {
          return ((a - 1u) / b + 1u);
         }
         ${$.mainStart(g)}

          let outputIndex = global_idx / ${g};
          let offset = outputIndex * uniforms.reduceSize;

          var bestValue = f32(${Bo[i]});
          let Length = uniforms.reduceSize;
          for (var k = local_idx; k < Length; k = k + ${g}) {
           let candidate = f32(${m.getByOffset("offset + k")});
           bestValue = ${Oo[i]};
          }
          aBestValues[local_idx] = bestValue;
          workgroupBarrier();

         var reduceSize = min(Length, ${g}u);
         for (var currentSize = reduceSize / 2u; reduceSize > 1u;
             currentSize = reduceSize / 2u) {
           let interval = DIV_CEIL(reduceSize, 2u);
           if (local_idx < currentSize) {
            let candidate = aBestValues[local_idx + interval];
            bestValue = ${Ro[i]};
            aBestValues[local_idx] = bestValue;
           }
           reduceSize = interval;
           workgroupBarrier();
         }

         if (local_idx == 0u) {
          ${h.setByOffset("outputIndex",`${i==="mean"?`${h.type.storage}(bestValue / f32(uniforms.reduceSize))`:`${h.type.storage}(${No[i]})`}`)};
         }
        }`;return{name:e,shaderCache:{hint:`${t};${g}`,inputDependencies:["type"]},getShaderSource:_,getRunData:()=>({outputs:[{dims:n,dataType:a}],dispatchGroup:{x:d},programUniforms:[{type:12,data:p}]})}},We=(e,t,r,i)=>{let a=e.inputs.length===1?r:_a(e.inputs,r),n=a.axes;n.length===0&&!a.noopWithEmptyAxes&&(n=e.inputs[0].dims.map((y,_)=>_));let s=O.normalizeAxes(n,e.inputs[0].dims.length),u=s,d=e.inputs[0],p=qo(u,e.inputs[0].dims.length);p.length>0&&(d=e.compute(Ne(e.inputs[0],p),{inputs:[0],outputs:[-1]})[0],u=Mo(u.length,d.dims.length));let[m,h]=Do(d.dims,u),g=m;a.keepDims&&(g=Uo(m,s)),e.compute(Wo(t,a.cacheKey,[d],i,e.inputs[0].dataType,g,h),{inputs:[d]})},_p=(e,t)=>{We(e,"ReduceMeanShared",t,"mean")},wp=(e,t)=>{We(e,"ReduceL1Shared",t,"l1")},bp=(e,t)=>{We(e,"ReduceL2Shared",t,"l2")},$p=(e,t)=>{We(e,"ReduceLogSumExpShared",t,"logSumExp")},vp=(e,t)=>{We(e,"ReduceMaxShared",t,"max")},xp=(e,t)=>{We(e,"ReduceMinShared",t,"min")},Sp=(e,t)=>{We(e,"ReduceProdShared",t,"prod")},Tp=(e,t)=>{We(e,"ReduceSumShared",t,"sum")},kp=(e,t)=>{We(e,"ReduceSumSquareShared",t,"sumSquare")},Ip=(e,t)=>{We(e,"ReduceLogSumShared",t,"logSum")}}),Le,Lo,Lr,_a,Ve,Vo,Go,Ho,Fo,jo,Ko,Qo,Zo,Yo,Xo,Ge,Ep,zp,Cp,Ap,Op,Rp,Bp,Np,Mp,Dp,La=P(()=>{J(),re(),ve(),ie(),Zg(),Le=e=>{if(!e||e.length===0||e.length>2)throw new Error("Reduce op requires 1 or 2 inputs.");if(e.length===2&&e[1].dims.length!==1)throw new Error("Invalid axes input dims.")},Lo=e=>["","",`var value = ${e.getByIndices("input_indices")};`,""],Lr=(e,t,r,i,a,n,s=!1,u=!1)=>{let d=[],p=r[0].dims,m=p.length,h=O.normalizeAxes(a,m),g=!u&&h.length===0;p.forEach(($,T)=>{g||h.indexOf(T)>=0?s&&d.push(1):d.push($)});let y=d.length,_=O.size(d);return{name:e,shaderCache:t,getShaderSource:$=>{let T=[],x=N("_A",r[0].dataType,m),w=F("output",n,y),I=i(x,w,h),S=I[2];for(let E=0,C=0;E<m;E++)g||h.indexOf(E)>=0?(s&&C++,S=`for(var j${E}: u32 = 0; j${E} < ${p[E]}; j${E}++) {
                  ${I[2].includes("last_index")?`let last_index = j${E};`:""}
                  ${x.indicesSet("input_indices",E,`j${E}`)}
                  ${S}
                }`):(T.push(`${x.indicesSet("input_indices",E,w.indicesGet("output_indices",C))};`),C++);return`

        ${$.registerUniform("output_size","u32").declareVariables(x,w)}

        ${$.mainStart()}
          ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          var input_indices: ${x.type.indices};
          let output_indices = ${w.offsetToIndices("global_idx")};

          ${T.join(`
`)}
          ${I[0]}       // init ops for reduce max/min
          ${I[1]}
          ${S}
          ${I[3]}
          ${I.length===4?w.setByOffset("global_idx","value"):I.slice(4).join(`
`)}
        }`},getRunData:()=>({outputs:[{dims:d,dataType:n}],dispatchGroup:{x:Math.ceil(_/64)},programUniforms:[{type:12,data:_},...K(p,d)]})}},_a=(e,t)=>{let r=[];return e[1].dims[0]>0&&e[1].getBigInt64Array().forEach(i=>r.push(Number(i))),he({axes:r,keepDims:t.keepDims,noopWithEmptyAxes:t.noopWithEmptyAxes})},Ve=(e,t,r,i)=>{let a=e.inputs,n=a.length===1?r:_a(a,r);e.compute(Lr(t,{hint:n.cacheKey,inputDependencies:["rank"]},[a[0]],n.noopWithEmptyAxes&&n.axes.length===0?Lo:i,n.axes,a[0].dataType,n.keepDims,n.noopWithEmptyAxes),{inputs:[0]})},Vo=(e,t)=>{Le(e.inputs),Ve(e,"ReduceLogSum",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,"value = log(value);"])},Go=(e,t)=>{Le(e.inputs),Ve(e,"ReduceL1",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += abs(${r.getByIndices("input_indices")});`,""])},Ho=(e,t)=>{Le(e.inputs),Ve(e,"ReduceL2",t,(r,i)=>[`var t = ${i.type.value}(0); var value = ${i.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += (t * t);`,"value = sqrt(value);"])},Fo=(e,t)=>{Le(e.inputs),Ve(e,"ReduceLogSumExp",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += exp(${r.getByIndices("input_indices")});`,"value = log(value);"])},jo=(e,t)=>{Le(e.inputs),Ve(e,"ReduceMax",t,(r,i,a)=>{let n=[];for(let s=0;s<r.rank;s++)(a.indexOf(s)>=0||a.length===0)&&n.push(r.indicesSet("input_indices",s,0));return[`${n.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = max(value, ${r.getByIndices("input_indices")});`,""]})},Ko=(e,t)=>{Le(e.inputs),Ve(e,"ReduceMean",t,(r,i,a)=>{let n=1;for(let s=0;s<r.rank;s++)(a.indexOf(s)>=0||a.length===0)&&(n*=e.inputs[0].dims[s]);return["var sum = f32(0);","",`sum += f32(${r.getByIndices("input_indices")});`,`let value = ${i.type.value}(sum / ${n});`]})},Qo=(e,t)=>{Le(e.inputs),Ve(e,"ReduceMin",t,(r,i,a)=>{let n=[];for(let s=0;s<r.rank;s++)(a.indexOf(s)>=0||a.length===0)&&n.push(`input_indices[${s}] = 0;`);return[`${n.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = min(value, ${r.getByIndices("input_indices")});`,""]})},Zo=(e,t)=>{Le(e.inputs),Ve(e,"ReduceProd",t,(r,i)=>[`var value = ${i.type.storage}(1);`,"",`value *= ${r.getByIndices("input_indices")};`,""])},Yo=(e,t)=>{Le(e.inputs),Ve(e,"ReduceSum",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,""])},Xo=(e,t)=>{Le(e.inputs),Ve(e,"ReduceSumSquare",t,(r,i)=>[`var t = ${i.type.value}(0); var value = ${i.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += t * t;`,""])},Ge=(e,t,r)=>{if(t.length===0)return r;let i=1,a=1;for(let n=0;n<t.length;n++)t.indexOf(n)===-1?i*=e[n]:a*=e[n];return a<32&&i>1024},Ep=(e,t)=>{Ge(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Ko(e,t):_p(e,t)},zp=(e,t)=>{Ge(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Go(e,t):wp(e,t)},Cp=(e,t)=>{Ge(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Ho(e,t):bp(e,t)},Ap=(e,t)=>{Ge(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Fo(e,t):$p(e,t)},Op=(e,t)=>{Ge(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?jo(e,t):vp(e,t)},Rp=(e,t)=>{Ge(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Qo(e,t):xp(e,t)},Bp=(e,t)=>{Ge(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Zo(e,t):Sp(e,t)},Np=(e,t)=>{Ge(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Yo(e,t):Tp(e,t)},Mp=(e,t)=>{Ge(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Xo(e,t):kp(e,t)},Dp=(e,t)=>{Ge(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Vo(e,t):Ip(e,t)}}),Di,Up,Pp,wa,Yg=P(()=>{J(),ve(),La(),Di=e=>{if(!e||e.length===0||e.length>2)throw new Error("ArgMinMaxOp op requires 1 or 2 inputs.");if(e[0].dataType!==1)throw new Error("Invalid input type.")},Up=(e,t)=>{Di(e.inputs);let r=(i,a,n)=>{let s=[];for(let u=0;u<i.rank;u++)(n.indexOf(u)>=0||n.length===0)&&s.push(`input_indices[${u}] = 0;`);return[`${s.join(`
`)}`,`var value = ${i.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${i.getByIndices("input_indices")} ${t.selectLastIndex>0?"<=":"<"} value) {
         value = ${i.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",a.setByOffset("global_idx","best_index")]};e.compute(Lr("ArgMin",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],r,[t.axis],7,t.keepDims),{inputs:[0]})},Pp=(e,t)=>{Di(e.inputs);let r=(i,a,n)=>{let s=[];for(let u=0;u<i.rank;u++)(n.indexOf(u)>=0||n.length===0)&&s.push(`input_indices[${u}] = 0;`);return[`${s.join(`
`)}`,`var value = ${i.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${i.getByIndices("input_indices")} ${t.selectLastIndex>0?">=":">"} value) {
         value = ${i.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",a.setByOffset("global_idx","best_index")]};e.compute(Lr("argMax",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],r,[t.axis],7,t.keepDims),{inputs:[0]})},wa=e=>he(e)}),Jo,zr,eu,tu,ru,lr,iu,qp,Va=P(()=>{J(),re(),qa(),ie(),Jo=(e,t)=>{let r=e[0],i=e[1],a=e[2],n=e[3],s=e[4],u=e[5];if(s&&u)throw new Error("Attention cannot have both past and attention_bias");if(r.dims.length!==3)throw new Error('Input "input" must have 3 dimensions');let d=r.dims[0],p=r.dims[1],m=r.dims[2];if(a.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimensions');if(i.dims.length!==2)throw new Error('Input "weights" is expected to have 2 dimensions');if(i.dims[0]!==m)throw new Error("Input 1 dimension 0 should have same length as dimension 2 of input 0");if(a.dims[0]!==i.dims[1])throw new Error('Input "bias" dimension 0 should have same length as dimension 1 of input "weights"');let h=a.dims[0]/3,g=h,y=g;if(t.qkvHiddenSizes.length>0){if(t.qkvHiddenSizes.length!==3)throw new Error("qkv_hidden_sizes attribute should have 3 elements");for(let I of t.qkvHiddenSizes)if(I%t.numHeads!==0)throw new Error("qkv_hidden_sizes should be divisible by num_heads");h=t.qkvHiddenSizes[0],g=t.qkvHiddenSizes[1],y=t.qkvHiddenSizes[2]}let _=p;if(h!==g)throw new Error("qkv_hidden_sizes first element should be same as the second");if(a.dims[0]!==h+g+y)throw new Error('Input "bias" dimension 0 should have same length as sum of Q/K/V hidden sizes');let $=0;if(s){if(g!==y)throw new Error('Input "past" expect k_hidden_size == v_hidden_size');if(s.dims.length!==5)throw new Error('Input "past" must have 5 dimensions');if(s.dims[0]!==2)throw new Error('Input "past" first dimension must be 2');if(s.dims[1]!==d)throw new Error('Input "past" second dimension must be batch_size');if(s.dims[2]!==t.numHeads)throw new Error('Input "past" third dimension must be num_heads');if(s.dims[4]!==g/t.numHeads)throw new Error('Input "past" fifth dimension must be k_hidden_size / num_heads');t.pastPresentShareBuffer||($=s.dims[3])}let T=_+$,x=-1,w=0;if(n)throw new Error("Mask not supported");if(s)throw new Error("past is not supported");if(u){if(u.dims.length!==4)throw new Error('Input "attention_bias" must have 4 dimensions');if(u.dims[0]!==d||u.dims[1]!==t.numHeads||u.dims[2]!==p||u.dims[3]!==T)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:d,sequenceLength:p,pastSequenceLength:$,kvSequenceLength:_,totalSequenceLength:T,maxSequenceLength:x,inputHiddenSize:m,hiddenSize:h,vHiddenSize:y,headSize:Math.floor(h/t.numHeads),vHeadSize:Math.floor(y/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:w,scale:t.scale,broadcastResPosBias:!1,passPastInKv:!1,qkvFormat:1}},zr=(e,t,r)=>t&&e?`
      let total_sequence_length_input = u32(${t.getByOffset("0")});
      let present_sequence_length = max(total_sequence_length_input, uniforms.past_sequence_length);
      let is_subsequent_prompt: bool = sequence_length > 1 && sequence_length != total_sequence_length_input;
      let is_first_prompt: bool = is_subsequent_prompt == false && sequence_length == total_sequence_length_input;
      total_sequence_length = u32(${e?.getByOffset("batchIdx")}) + 1;
      var past_sequence_length: u32 = 0;
      if (is_first_prompt == false) {
        past_sequence_length = total_sequence_length - sequence_length;
      }
       `:`
    ${r?"let past_sequence_length = uniforms.past_sequence_length":""};
    let present_sequence_length = total_sequence_length;
    `,eu=(e,t,r,i,a,n,s,u)=>{let d=$e(s?1:n),p=64,m=n/d;m<p&&(p=32);let h=Math.ceil(n/d/p),g=[{type:12,data:t},{type:12,data:r},{type:12,data:i},{type:12,data:a},{type:12,data:m},{type:12,data:h}],y=Te(e.dataType,d),_=Ee(1,d),$=["type"];s&&$.push("type"),u&&$.push("type");let T=x=>{let w=F("x",e.dataType,e.dims,d),I=[w],S=s?N("seq_lens",s.dataType,s.dims):void 0;S&&I.push(S);let E=u?N("total_sequence_length_input",u.dataType,u.dims):void 0;E&&I.push(E);let C=Ee(e.dataType),A=[{name:"batch_size",type:"u32"},{name:"num_heads",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"sequence_length",type:"u32"},{name:"total_sequence_length",type:"u32"},{name:"elements_per_thread",type:"u32"}];return`
  var<workgroup> thread_max: array<f32, ${p}>;
  var<workgroup> thread_sum: array<f32, ${p}>;
  ${x.registerUniforms(A).declareVariables(...I)}
  ${x.mainStart([p,1,1])}
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let sequence_length = uniforms.sequence_length;
    var total_sequence_length = uniforms.total_sequence_length;
    ${zr(S,E,!1)}
    let local_offset = local_idx * uniforms.elements_per_thread;
    let offset = (global_idx / ${p}) * uniforms.total_sequence_length + local_offset;
    let seq_causal_length = ${s?"u32(past_sequence_length + workgroup_id.y + 1)":"total_sequence_length"};
    var thread_max_vector = ${_}(-3.4028234663852886e+38f);
    for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
      thread_max_vector = max(${_}(x[offset + i]), thread_max_vector);
    }
    thread_max[local_idx] = ${(()=>{switch(d){case 1:return"thread_max_vector";case 2:return"max(thread_max_vector.x, thread_max_vector.y)";case 4:return"max(max(thread_max_vector.x, thread_max_vector.y), max(thread_max_vector.z, thread_max_vector.w))";default:throw new Error(`Unsupported components: ${d}`)}})()};
    workgroupBarrier();

    var max_value =  f32(-3.4028234663852886e+38f);
    for (var i = 0u; i < ${p}; i++) {
      max_value = max(thread_max[i], max_value);
    }

    var sum_vector = ${_}(0);
    for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
      sum_vector += exp(${_}(x[offset + i]) - max_value);
    }
    thread_sum[local_idx] = ${(()=>{switch(d){case 1:return"sum_vector";case 2:return"sum_vector.x + sum_vector.y";case 4:return"sum_vector.x + sum_vector.y + sum_vector.z + sum_vector.w";default:throw new Error(`Unsupported components: ${d}`)}})()};
    workgroupBarrier();

    var sum: f32 = 0;
    for (var i = 0u; i < ${p}; i++) {
      sum += thread_sum[i];
    }

    if (sum == 0) {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        x[offset + i] = ${w.type.value}(${C}(1.0) / ${C}(seq_causal_length));
      }
    } else {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        var f32input = ${_}(x[offset + i]);
        x[offset + i] = ${w.type.value}(exp(f32input - max_value) / sum);
      }
    }
      ${s?`
        for (var total_seq_id: u32 = seq_causal_length; total_seq_id + local_offset < uniforms.total_sequence_length; total_seq_id++) {
          x[offset + total_seq_id] = ${w.type.value}(${C}(0));
        }`:""};
  }`};return{name:"AttentionProbsSoftmax",shaderCache:{hint:`${p};${y};${d}`,inputDependencies:$},getShaderSource:T,getRunData:()=>({outputs:[],dispatchGroup:{x:1,y:a,z:t*r},programUniforms:g})}},tu=(e,t,r,i,a,n,s,u,d)=>{let p=s+n.kvSequenceLength,m=[n.batchSize,n.numHeads,n.sequenceLength,p],h=e>1&&i,g=n.kvNumHeads?n.kvNumHeads:n.numHeads,y=h?[n.batchSize,g,p,n.headSize]:void 0,_=n.nReps?n.nReps:1,$=n.scale===0?1/Math.sqrt(n.headSize):n.scale,T=$e(n.headSize),x=n.headSize/T,w=12,I={x:Math.ceil(p/w),y:Math.ceil(n.sequenceLength/w),z:n.batchSize*n.numHeads},S=[{type:12,data:n.sequenceLength},{type:12,data:x},{type:12,data:p},{type:12,data:n.numHeads},{type:12,data:n.headSize},{type:1,data:$},{type:12,data:s},{type:12,data:n.kvSequenceLength},{type:12,data:_}],E=h&&i&&O.size(i.dims)>0,C=["type","type"];E&&C.push("type"),a&&C.push("type"),u&&C.push("type"),d&&C.push("type");let A=[{dims:m,dataType:t.dataType,gpuDataType:0}];h&&A.push({dims:y,dataType:t.dataType,gpuDataType:0});let v=U=>{let q=N("q",t.dataType,t.dims,T),Y=N("key",r.dataType,r.dims,T),H=[q,Y];if(E){let X=N("past_key",i.dataType,i.dims,T);H.push(X)}a&&H.push(N("attention_bias",a.dataType,a.dims));let Q=u?N("seq_lens",u.dataType,u.dims):void 0;Q&&H.push(Q);let R=d?N("total_sequence_length_input",d.dataType,d.dims):void 0;R&&H.push(R);let D=F("output",t.dataType,m),G=[D];h&&G.push(F("present_key",t.dataType,y,T));let ee=Ee(1,T),Z=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"alpha",type:"f32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${w}u;

  var<workgroup> tileQ: array<${q.type.storage}, ${w*w}>;
  var<workgroup> tileK: array<${q.type.storage}, ${w*w}>;
  ${U.registerUniforms(Z).declareVariables(...H,...G)}
  ${U.mainStart([w,w,1])}
    // x holds the N and y holds the M
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let kvHeadIdx = ${_===1?"headIdx":"headIdx / uniforms.n_reps"};
    let kv_num_heads = ${_===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let m = workgroup_id.y * TILE_SIZE;
    let n = workgroup_id.x * TILE_SIZE;
    let sequence_length = uniforms.M;
    var total_sequence_length = uniforms.N;
    ${zr(Q,R,!0)}
    let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx;
    let qOffset = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
    ${E&&h?"let pastKeyOffset = absKvHeadIdx * uniforms.past_sequence_length * uniforms.K;":""};
    let kOffset = absKvHeadIdx * uniforms.kv_sequence_length * uniforms.K;
    ${h?"let presentKeyOffset = absKvHeadIdx * uniforms.N * uniforms.K;":""}
    var value = ${ee}(0);
    for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (global_id.y < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = q[qOffset + local_id.y * uniforms.K + w + local_id.x];
      }
      if (n + local_id.y < uniforms.N && w + local_id.x < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
      ${E&&h?`
              if (n + local_id.y < past_sequence_length) {
                tileK[idx] = past_key[pastKeyOffset + (n + local_id.y) * uniforms.K + w + local_id.x];
              } else if (n + local_id.y - past_sequence_length < uniforms.kv_sequence_length) {
                tileK[idx] = key[kOffset + (n + local_id.y - past_sequence_length) * uniforms.K + w + local_id.x];
              }`:`
          if (n + local_id.y < uniforms.kv_sequence_length) {
            tileK[idx] = key[kOffset + (n + local_id.y) * uniforms.K + w + local_id.x];
          }`}
      ${h?`if (n + local_id.y < present_sequence_length) {
        present_key[presentKeyOffset + (n + local_id.y) * uniforms.K + w + local_id.x] = tileK[idx];
      }`:""}
      }
      workgroupBarrier();

      for (var k: u32 = 0u; k < TILE_SIZE && w+k < uniforms.K; k++) {
          value += ${ee}(tileQ[TILE_SIZE * local_id.y + k] * tileK[TILE_SIZE * local_id.x + k]);
      }

      workgroupBarrier();
    }

    if (global_id.y < uniforms.M && global_id.x < total_sequence_length) {
      let headOffset = workgroup_id.z * uniforms.M * uniforms.N;
      let outputIdx = headOffset + global_id.y * uniforms.N + global_id.x;
      var sum: f32 = ${(()=>{switch(T){case 1:return"value";case 2:return"value.x + value.y";case 4:return"value.x + value.y + value.z + value.w";default:throw new Error(`Unsupported components: ${T}`)}})()};
        output[outputIdx] = ${D.type.value} (sum * uniforms.alpha) + ${a?"attention_bias[outputIdx]":"0.0"};
    }
  }`};return{name:"AttentionProbs",shaderCache:{hint:`${T};${a!==void 0};${i!==void 0};${e}`,inputDependencies:C},getRunData:()=>({outputs:A,dispatchGroup:I,programUniforms:S}),getShaderSource:v}},ru=(e,t,r,i,a,n,s=void 0,u=void 0)=>{let d=n+a.kvSequenceLength,p=a.nReps?a.nReps:1,m=a.vHiddenSize*p,h=e>1&&i,g=a.kvNumHeads?a.kvNumHeads:a.numHeads,y=h?[a.batchSize,g,d,a.headSize]:void 0,_=[a.batchSize,a.sequenceLength,m],$=12,T={x:Math.ceil(a.vHeadSize/$),y:Math.ceil(a.sequenceLength/$),z:a.batchSize*a.numHeads},x=[{type:12,data:a.sequenceLength},{type:12,data:d},{type:12,data:a.vHeadSize},{type:12,data:a.numHeads},{type:12,data:a.headSize},{type:12,data:m},{type:12,data:n},{type:12,data:a.kvSequenceLength},{type:12,data:p}],w=h&&i&&O.size(i.dims)>0,I=["type","type"];w&&I.push("type"),s&&I.push("type"),u&&I.push("type");let S=[{dims:_,dataType:t.dataType,gpuDataType:0}];h&&S.push({dims:y,dataType:t.dataType,gpuDataType:0});let E=C=>{let A=N("probs",t.dataType,t.dims),v=N("v",r.dataType,r.dims),U=[A,v];w&&U.push(N("past_value",i.dataType,i.dims));let q=s?N("seq_lens",s.dataType,s.dims):void 0;s&&U.push(q);let Y=u?N("total_sequence_length_input",u.dataType,u.dims):void 0;u&&U.push(Y);let H=[F("output",t.dataType,_)];h&&H.push(F("present_value",t.dataType,y));let Q=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"v_hidden_size",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${$}u;
  var<workgroup> tileQ: array<${A.type.value}, ${$*$}>;
  var<workgroup> tileV: array<${A.type.value}, ${$*$}>;
  ${C.registerUniforms(Q).declareVariables(...U,...H)}
  ${C.mainStart([$,$,1])}
   let headIdx = workgroup_id.z % uniforms.num_heads;
   let batchIdx = workgroup_id.z / uniforms.num_heads;
   let kvHeadIdx = ${p===1?"headIdx":"headIdx / uniforms.n_reps"};
   let kv_num_heads = ${p===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
   let m = global_id.y;
   let n = global_id.x;
   let sequence_length = uniforms.M;
   var total_sequence_length = uniforms.K;
   ${zr(q,Y,!0)}
   let offsetA = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
   let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx; // kvHeadIdx is relative to the batch
   ${w&&h?"let pastValueOffset = absKvHeadIdx * uniforms.N * uniforms.past_sequence_length + n;":""};
   let vOffset = absKvHeadIdx * uniforms.N * uniforms.kv_sequence_length + n;
   ${h?"let presentValueOffset = absKvHeadIdx * uniforms.N * uniforms.K + n;":""}
   var value = ${A.type.storage}(0);
   for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (m < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = probs[offsetA + w + local_id.x];
      }
      if (n < uniforms.N && w + local_id.y < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
        ${w&&h?`
        if (w + local_id.y < past_sequence_length) {
          tileV[idx] = past_value[pastValueOffset + (w + local_id.y) * uniforms.N];
        } else if (w + local_id.y - past_sequence_length < uniforms.kv_sequence_length) {
          tileV[idx] = v[vOffset + (w + local_id.y - past_sequence_length) * uniforms.N];
        }
      `:`
            if (w + local_id.y < uniforms.kv_sequence_length) {
              tileV[idx] = v[vOffset + (w + local_id.y) * uniforms.N];
            }`}
        ${h?`
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
  }`};return{name:"AttentionScore",shaderCache:{hint:`${i!==void 0};${e}`,inputDependencies:I},getRunData:()=>({outputs:S,dispatchGroup:T,programUniforms:x}),getShaderSource:E}},lr=(e,t,r,i,a,n,s,u,d,p,m=void 0,h=void 0)=>{let g=Math.min(e.outputCount,1+(s?1:0)+(u?1:0)),y=g>1?p.pastSequenceLength:0,_=y+p.kvSequenceLength,$=d&&O.size(d.dims)>0?d:void 0,T=[t,r];g>1&&s&&O.size(s.dims)>0&&T.push(s),$&&T.push($),m&&T.push(m),h&&T.push(h);let x=e.compute(tu(g,t,r,s,$,p,y,m,h),{inputs:T,outputs:g>1?[-1,1]:[-1]})[0];e.compute(eu(x,p.batchSize,p.numHeads,y,p.sequenceLength,_,m,h),{inputs:m&&h?[x,m,h]:[x],outputs:[]});let w=[x,i];g>1&&u&&O.size(u.dims)>0&&w.push(u),m&&w.push(m),h&&w.push(h),e.compute(ru(g,x,i,u,p,y,m,h),{inputs:w,outputs:g>1?[0,2]:[0]})},iu=(e,t)=>{let r=[t.batchSize,t.numHeads,t.sequenceLength,t.headSize],i=t.sequenceLength,a=t.inputHiddenSize,n=t.headSize,s=12,u={x:Math.ceil(t.headSize/s),y:Math.ceil(t.sequenceLength/s),z:t.batchSize*t.numHeads},d=[e.inputs[0],e.inputs[1],e.inputs[2]],p=[{type:12,data:i},{type:12,data:a},{type:12,data:n},{type:12,data:t.numHeads},{type:12,data:t.headSize},{type:12,data:t.hiddenSize},{type:12,data:t.hiddenSize+t.hiddenSize+t.vHiddenSize}],m=h=>{let g=F("output_q",d[0].dataType,r),y=F("output_k",d[0].dataType,r),_=F("output_v",d[0].dataType,r),$=N("input",d[0].dataType,d[0].dims),T=N("weight",d[1].dataType,d[1].dims),x=N("bias",d[2].dataType,d[2].dims),w=$.type.storage,I=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"hidden_size",type:"u32"},{name:"ldb",type:"u32"}];return`
  const TILE_SIZE = ${s}u;
  var<workgroup> tileInput: array<${w}, ${s*s}>;
  var<workgroup> tileWeightQ: array<${w}, ${s*s}>;
  var<workgroup> tileWeightK: array<${w}, ${s*s}>;
  var<workgroup> tileWeightV: array<${w}, ${s*s}>;
  ${h.registerUniforms(I).declareVariables($,T,x,g,y,_)}
  ${h.mainStart([s,s,1])}
    let batchIndex = workgroup_id.z / uniforms.num_heads;
    let headNumber = workgroup_id.z % uniforms.num_heads;
    let m = global_id.y;
    let n = global_id.x;

    let inputOffset = batchIndex * (uniforms.M * uniforms.K) + m * uniforms.K;
    let biasOffsetQ = headNumber * uniforms.head_size;
    let biasOffsetK = uniforms.hidden_size + biasOffsetQ;
    let biasOffsetV = uniforms.hidden_size + biasOffsetK;

    var valueQ = ${w}(0);
    var valueK = ${w}(0);
    var valueV = ${w}(0);
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
  }`};return e.compute({name:"AttentionPrepare",shaderCache:{inputDependencies:["type","type","type"]},getRunData:()=>({outputs:[{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0}],dispatchGroup:u,programUniforms:p}),getShaderSource:m},{inputs:d,outputs:[-1,-1,-1]})},qp=(e,t)=>{let r=Jo(e.inputs,t),[i,a,n]=iu(e,r);return lr(e,i,a,n,e.inputs[4],void 0,void 0,void 0,e.inputs[5],r)}}),au,nu,su,Wp,Xg=P(()=>{Pe(),J(),re(),ve(),ie(),au=(e,t)=>{if(!e||e.length!==5)throw new Error("BatchNormalization requires 5 inputs");let r=(i,a,n)=>{let s=a.length;if(s!==i.length)throw new Error(`${n}: num dimensions != ${s}`);a.forEach((u,d)=>{if(u!==i[d])throw new Error(`${n}: dim[${d}] do not match`)})};if(e[0].dims.length>1){let i=t.format==="NHWC"?t.spatial?e[0].dims.slice(-1):e[0].dims.slice(-1).concat(e[0].dims.slice(1,e[0].dims.length-1)):e[0].dims.slice(1,t.spatial?2:void 0);r(e[1].dims,i,"Invalid input scale"),r(e[2].dims,i,"Invalid input B"),r(e[3].dims,i,"Invalid input mean"),r(e[4].dims,i,"Invalid input var")}else r(e[1].dims,[1],"Invalid input scale"),r(e[2].dims,[1],"Invalid input B"),r(e[3].dims,[1],"Invalid input mean"),r(e[4].dims,[1],"Invalid input var")},nu=(e,t)=>{let{epsilon:r,spatial:i,format:a}=t,n=e[0].dims,s=i?$e(n[n.length-1]):1,u=a==="NHWC"&&n.length>1?s:1,d=O.size(n)/s,p=i,m=p?n.length:n,h=N("x",e[0].dataType,e[0].dims,s),g=N("scale",e[1].dataType,e[1].dims,u),y=N("bias",e[2].dataType,e[2].dims,u),_=N("inputMean",e[3].dataType,e[3].dims,u),$=N("inputVar",e[4].dataType,e[4].dims,u),T=F("y",e[0].dataType,m,s),x=()=>{let I="";if(i)I=`let cOffset = ${n.length===1?"0u":a==="NHWC"?`outputIndices[${n.length-1}] / ${s}`:"outputIndices[1]"};`;else if(a==="NCHW")I=`
            ${T.indicesSet("outputIndices","0","0")}
            let cOffset = ${T.indicesToOffset("outputIndices")};`;else{I=`var cIndices = ${g.type.indices}(0);
                       cIndices[0] = outputIndices[${n.length-1}];`;for(let S=1;S<g.rank;S++)I+=`cIndices[${S}] = outputIndices[${S}];`;I+=`let cOffset = ${g.indicesToOffset("cIndices")};`}return I},w=I=>`
  const epsilon = ${r};
  ${I.registerUniform("outputSize","u32").declareVariables(h,g,y,_,$,T)}
  ${I.mainStart()}
  ${I.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
    var outputIndices = ${T.offsetToIndices(`global_idx * ${s}`)};
    ${x()}
    let scale = ${g.getByOffset("cOffset")};
    let bias = ${y.getByOffset("cOffset")};
    let inputMean = ${_.getByOffset("cOffset")};
    let inputVar = ${$.getByOffset("cOffset")};
    let x = ${h.getByOffset("global_idx")};
    let value = (x - inputMean) * inverseSqrt(inputVar + epsilon) * scale + bias;
    ${T.setByOffset("global_idx","value")}
  }`;return{name:"BatchNormalization",shaderCache:{hint:`${t.epsilon}_${t.format}_${i}_${s}`,inputDependencies:p?["rank","type","type","type","type"]:void 0},getShaderSource:w,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:p?[{type:12,data:d},...K(n)]:[{type:12,data:d}]})}},su=e=>he(e),Wp=(e,t)=>{let{inputs:r,outputCount:i}=e,a=su({...t,outputCount:i});if(we.webgpu.validateInputContent&&au(r,a),t.trainingMode)throw new Error("BatchNormalization trainingMode is not supported yet.");e.compute(nu(r,a))}}),ou,uu,Lp,Jg=P(()=>{re(),ie(),ou=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![320,640,1280].includes(e[0].dims[2]))throw new Error("number of channels should be 320, 640 or 1280");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},uu=e=>{let t=e[0].dims,r=e[0].dims[2],i=O.size(t)/4,a=e[0].dataType,n=N("input",a,t,4),s=N("bias",a,[r],4),u=N("residual",a,t,4),d=F("output",a,t,4);return{name:"BiasAdd",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(i/64)}}),getShaderSource:p=>`
  const channels = ${r}u / 4;
  ${p.declareVariables(n,s,u,d)}

  ${p.mainStart()}
    ${p.guardAgainstOutOfBoundsWorkgroupSizes(i)}
    let value = ${n.getByOffset("global_idx")}
      + ${s.getByOffset("global_idx % channels")} + ${u.getByOffset("global_idx")};
    ${d.setByOffset("global_idx","value")}
  }`}},Lp=e=>{ou(e.inputs),e.compute(uu(e.inputs))}}),lu,ce,Vp,Gp,Hp,Fp,jp,Kp,Qp,Zp,Yp,du,Xp,Jp,ec,tc,nr,rc,Dr,ic,ac,nc,sc,oc,uc,lc,dc,pc,cc,hc,fc,mc,gc,yc,_c,Ui,wc,ba,$a,bc,$c,vc,pu,cu,xc,Ga=P(()=>{J(),re(),ve(),ie(),lu=(e,t,r,i,a,n,s)=>{let u=Math.ceil(t/4),d="";typeof a=="string"?d=`${a}(a)`:d=a("a");let p=N("inputData",r,[u],4),m=F("outputData",i,[u],4),h=[{name:"vec_size",type:"u32"}];return s&&h.push(...s),`
      ${e.registerUniforms(h).declareVariables(p,m)}

  ${n??""}

  ${e.mainStart()}
    ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}

    let a = ${p.getByOffset("global_idx")};
    ${m.setByOffset("global_idx",d)}
  }`},ce=(e,t,r,i,a,n=e.dataType,s,u)=>{let d=[{type:12,data:Math.ceil(O.size(e.dims)/4)}];return s&&d.push(...s),{name:t,shaderCache:{hint:a,inputDependencies:["type"]},getShaderSource:p=>lu(p,O.size(e.dims),e.dataType,n,r,i,u),getRunData:p=>({outputs:[{dims:e.dims,dataType:n}],dispatchGroup:{x:Math.ceil(O.size(p[0].dims)/64/4)},programUniforms:d})}},Vp=e=>{e.compute(ce(e.inputs[0],"Abs","abs"))},Gp=e=>{e.compute(ce(e.inputs[0],"Acos","acos"))},Hp=e=>{e.compute(ce(e.inputs[0],"Acosh","acosh"))},Fp=e=>{e.compute(ce(e.inputs[0],"Asin","asin"))},jp=e=>{e.compute(ce(e.inputs[0],"Asinh","asinh"))},Kp=e=>{e.compute(ce(e.inputs[0],"Atan","atan"))},Qp=e=>{e.compute(ce(e.inputs[0],"Atanh","atanh"))},Zp=e=>he(e),Yp=(e,t)=>{let r;switch(t.to){case 10:r="vec4<f16>";break;case 1:r="vec4<f32>";break;case 12:r="vec4<u32>";break;case 6:r="vec4<i32>";break;case 9:r="vec4<bool>";break;default:throw new RangeError(`not supported type (specified in attribute 'to' from 'Cast' operator): ${t.to}`)}e.compute(ce(e.inputs[0],"Cast",r,void 0,t.cacheKey,t.to))},du=e=>{let t,r,i=e.length>=2&&e[1].data!==0,a=e.length>=3&&e[2].data!==0;switch(e[0].dataType){case 1:t=i?e[1].getFloat32Array()[0]:-34028234663852886e22,r=a?e[2].getFloat32Array()[0]:34028234663852886e22;break;case 10:t=i?e[1].getUint16Array()[0]:64511,r=a?e[2].getUint16Array()[0]:31743;break;default:throw new Error("Unsupport data type")}return he({min:t,max:r})},Xp=(e,t)=>{let r=t||du(e.inputs),i=Ee(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"Clip",a=>`clamp(${a}, vec4<${i}>(uniforms.min), vec4<${i}>(uniforms.max))`,void 0,r.cacheKey,void 0,[{type:e.inputs[0].dataType,data:r.min},{type:e.inputs[0].dataType,data:r.max}],[{name:"min",type:i},{name:"max",type:i}]),{inputs:[0]})},Jp=e=>{e.compute(ce(e.inputs[0],"Ceil","ceil"))},ec=e=>{e.compute(ce(e.inputs[0],"Cos","cos"))},tc=e=>{e.compute(ce(e.inputs[0],"Cosh","cosh"))},nr=e=>he(e),rc=(e,t)=>{let r=Ee(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"Elu",i=>`elu_vf32(${i})`,`
  const elu_alpha_ = ${r}(${t.alpha});

  fn elu_f32(a: ${r}) -> ${r} {
  return select((exp(a) - 1.0) * elu_alpha_, a, a >= 0.0);
  }

  fn elu_vf32(v: vec4<${r}>) -> vec4<${r}> {
  return vec4(elu_f32(v.x), elu_f32(v.y), elu_f32(v.z), elu_f32(v.w));
  }`,t.cacheKey))},Dr=(e="f32")=>`
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
}`,ic=e=>{let t=Ee(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"Erf",r=>`erf_vf32(${r})`,Dr(t)))},ac=e=>{e.compute(ce(e.inputs[0],"Exp","exp"))},nc=e=>{e.compute(ce(e.inputs[0],"Floor","floor"))},sc=e=>{let t=Ee(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"Gelu",r=>`0.5 * ${r} * (1.0 + erf_vf32(${r} * 0.7071067811865475))`,Dr(t)))},oc=(e,t)=>{let r=Ee(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"LeakyRelu",i=>`select(leaky_relu_alpha_ * ${i}, ${i}, ${i} >= vec4<${r}>(0.0))`,`const leaky_relu_alpha_ = ${r}(${t.alpha});`,t.cacheKey))},uc=e=>{e.compute(ce(e.inputs[0],"Not",t=>`!${t}`))},lc=e=>{e.compute(ce(e.inputs[0],"Neg",t=>`-${t}`))},dc=e=>{e.compute(ce(e.inputs[0],"Reciprocal",t=>`1.0/${t}`))},pc=e=>{let t=Ee(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"Relu",r=>`select(vec4<${t}>(0.0), ${r}, ${r} > vec4<${t}>(0.0))`))},cc=e=>{e.compute(ce(e.inputs[0],"Sigmoid",t=>`(1.0 / (1.0 + exp(-${t})))`))},hc=e=>he(e),fc=(e,t)=>{let r=Ee(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"HardSigmoid",i=>`max(vec4<${r}>(0.0), min(vec4<${r}>(1.0), ${t.alpha} * ${i} + vec4<${r}>(${t.beta})))`,void 0,t.cacheKey))},mc=e=>{e.compute(ce(e.inputs[0],"Sin","sin"))},gc=e=>{e.compute(ce(e.inputs[0],"Sinh","sinh"))},yc=e=>{e.compute(ce(e.inputs[0],"Sqrt","sqrt"))},_c=e=>{e.compute(ce(e.inputs[0],"Tan","tan"))},Ui=e=>`sign(${e}) * (1 - exp(-2 * abs(${e}))) / (1 + exp(-2 * abs(${e})))`,wc=e=>{e.compute(ce(e.inputs[0],"Tanh",Ui))},ba=(e="f32")=>`
const fast_gelu_a: ${e} = 0.5;
const fast_gelu_b: ${e} = 0.7978845608028654;
const fast_gelu_c: ${e} = 0.035677408136300125;

fn tanh_v(v: vec4<${e}>) -> vec4<${e}> {
  return ${Ui("v")};
}
`,$a=e=>`(fast_gelu_a + fast_gelu_a * tanh_v(${e} * (fast_gelu_c * ${e} * ${e} + fast_gelu_b))) * ${e}`,bc=e=>{let t=Ee(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"FastGelu",$a,ba(t),void 0,e.inputs[0].dataType))},$c=(e,t)=>{let r=Ee(e.inputs[0].dataType);return e.compute(ce(e.inputs[0],"ThresholdedRelu",i=>`select(vec4<${r}>(0.0), ${i}, ${i} > thresholded_relu_alpha_)`,`const thresholded_relu_alpha_ = vec4<${r}>(${t.alpha});`,t.cacheKey)),0},vc=e=>{e.compute(ce(e.inputs[0],"Log","log"))},pu=(e,t)=>`
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
`,cu=e=>`quick_gelu_impl(${e})`,xc=(e,t)=>{let r=Ee(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"QuickGelu",cu,pu(r,t.alpha),t.cacheKey,e.inputs[0].dataType))}}),hu,fu,Sc,ey=P(()=>{re(),ie(),Ga(),hu=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![2560,5120,10240].includes(e[0].dims[2]))throw new Error("hidden state should be 2560, 5120 or 10240");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},fu=e=>{let t=e[0].dims.slice();t[2]=t[2]/2;let r=N("input",e[0].dataType,e[0].dims,4),i=N("bias",e[0].dataType,[e[0].dims[2]],4),a=F("output",e[0].dataType,t,4),n=O.size(t)/4,s=Te(e[0].dataType);return{name:"BiasSplitGelu",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(n/64)}}),getShaderSource:u=>`
  const M_SQRT2 = sqrt(2.0);
  const halfChannels = ${e[0].dims[2]/4/2}u;

  ${u.declareVariables(r,i,a)}

  ${Dr(s)}

  ${u.mainStart()}
    ${u.guardAgainstOutOfBoundsWorkgroupSizes(n)}
    let biasIdx = global_idx % halfChannels;
    let batchIndex = global_idx / halfChannels;
    let inputOffset = biasIdx + batchIndex * halfChannels * 2;
    let valueLeft = input[inputOffset] + bias[biasIdx];
    let valueRight = input[inputOffset + halfChannels] + bias[biasIdx + halfChannels];
    let geluRight = valueRight * 0.5 * (erf_vf32(valueRight / M_SQRT2) + 1);

    ${a.setByOffset("global_idx","valueLeft * geluRight")}
  }`}},Sc=e=>{hu(e.inputs),e.compute(fu(e.inputs))}}),mu,gu,He,Tc,kc,Ic,Ec,zc,Cc,Ac,Oc,Rc,Bc,ty=P(()=>{J(),re(),ie(),mu=(e,t,r,i,a,n,s,u,d,p,m,h)=>{let g,y;typeof u=="string"?g=y=(w,I)=>`${u}((${w}),(${I}))`:typeof u=="function"?g=y=u:(g=u.scalar,y=u.vector);let _=F("outputData",m,i.length,4),$=N("aData",d,t.length,4),T=N("bData",p,r.length,4),x;if(a)if(n){let w=O.size(t)===1,I=O.size(r)===1,S=t.length>0&&t[t.length-1]%4===0,E=r.length>0&&r[r.length-1]%4===0;w||I?x=_.setByOffset("global_idx",y(w?`${$.type.value}(${$.getByOffset("0")}.x)`:$.getByOffset("global_idx"),I?`${T.type.value}(${T.getByOffset("0")}.x)`:T.getByOffset("global_idx"))):x=`
            let outputIndices = ${_.offsetToIndices("global_idx * 4u")};
            let offsetA = ${$.broadcastedIndicesToOffset("outputIndices",_)};
            let offsetB = ${T.broadcastedIndicesToOffset("outputIndices",_)};
            ${_.setByOffset("global_idx",y(s||S?$.getByOffset("offsetA / 4u"):`${$.type.value}(${$.getByOffset("offsetA / 4u")}[offsetA % 4u])`,s||E?T.getByOffset("offsetB / 4u"):`${T.type.value}(${T.getByOffset("offsetB / 4u")}[offsetB % 4u])`))}
          `}else x=_.setByOffset("global_idx",y($.getByOffset("global_idx"),T.getByOffset("global_idx")));else{if(!n)throw new Error("no necessary to use scalar implementation for element-wise binary op implementation.");let w=(I,S,E="")=>{let C=`aData[indexA${S}][componentA${S}]`,A=`bData[indexB${S}][componentB${S}]`;return`
            let outputIndices${S} = ${_.offsetToIndices(`global_idx * 4u + ${S}u`)};
            let offsetA${S} = ${$.broadcastedIndicesToOffset(`outputIndices${S}`,_)};
            let offsetB${S} = ${T.broadcastedIndicesToOffset(`outputIndices${S}`,_)};
            let indexA${S} = offsetA${S} / 4u;
            let indexB${S} = offsetB${S} / 4u;
            let componentA${S} = offsetA${S} % 4u;
            let componentB${S} = offsetB${S} % 4u;
            ${I}[${S}] = ${E}(${g(C,A)});
          `};m===9?x=`
            var data = vec4<u32>(0);
            ${w("data",0,"u32")}
            ${w("data",1,"u32")}
            ${w("data",2,"u32")}
            ${w("data",3,"u32")}
            outputData[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:x=`
            ${w("outputData[global_idx]",0)}
            ${w("outputData[global_idx]",1)}
            ${w("outputData[global_idx]",2)}
            ${w("outputData[global_idx]",3)}
          `}return`
        ${e.registerUniform("vec_size","u32").declareVariables($,T,_)}

        ${h??""}

        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${x}
      }`},gu=(e,t,r,i,a,n,s=r.dataType)=>{let u=r.dims.map(Number),d=i.dims.map(Number),p=!O.areEqual(u,d),m=u,h=O.size(u),g=!1,y=!1,_=[p];if(p){let $=Pt.calcShape(u,d,!1);if(!$)throw new Error("Can't perform binary op on the given tensors");m=$.slice(),h=O.size(m);let T=O.size(u)===1,x=O.size(d)===1,w=u.length>0&&u[u.length-1]%4===0,I=d.length>0&&d[d.length-1]%4===0;_.push(T),_.push(x),_.push(w),_.push(I);let S=1;for(let E=1;E<m.length;E++){let C=u[u.length-E],A=d[d.length-E];if(C===A)S*=C;else break}S%4===0?(y=!0,g=!0):(T||x||w||I)&&(g=!0)}else g=!0;return _.push(g),{name:e,shaderCache:{hint:t+_.map($=>$.toString()).join("_"),inputDependencies:["rank","rank"]},getShaderSource:$=>mu($,u,d,m,g,p,y,a,r.dataType,i.dataType,s,n),getRunData:()=>({outputs:[{dims:m,dataType:s}],dispatchGroup:{x:Math.ceil(h/64/4)},programUniforms:[{type:12,data:Math.ceil(O.size(m)/4)},...K(u,d,m)]})}},He=(e,t,r,i,a,n)=>{e.compute(gu(t,a??"",e.inputs[0],e.inputs[1],r,i,n))},Tc=e=>{He(e,"Add",(t,r)=>`${t}+${r}`)},kc=e=>{He(e,"Div",(t,r)=>`${t}/${r}`)},Ic=e=>{He(e,"Equal",{scalar:(t,r)=>`u32(${t}==${r})`,vector:(t,r)=>`vec4<u32>(${t}==${r})`},void 0,void 0,9)},Ec=e=>{He(e,"Mul",(t,r)=>`${t}*${r}`)},zc=e=>{let t=N("input",e.inputs[0].dataType,e.inputs[0].dims).type.value;He(e,"Pow",{scalar:(r,i)=>`pow_custom(${r},${i})`,vector:(r,i)=>`pow_vector_custom(${r},${i})`},`
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
      `)},Cc=e=>{He(e,"Sub",(t,r)=>`${t}-${r}`)},Ac=e=>{He(e,"Greater",{scalar:(t,r)=>`u32(${t}>${r})`,vector:(t,r)=>`vec4<u32>(${t}>${r})`},void 0,void 0,9)},Oc=e=>{He(e,"Less",{scalar:(t,r)=>`u32(${t}<${r})`,vector:(t,r)=>`vec4<u32>(${t}<${r})`},void 0,void 0,9)},Rc=e=>{He(e,"GreaterOrEqual",{scalar:(t,r)=>`u32(${t}>=${r})`,vector:(t,r)=>`vec4<u32>(${t}>=${r})`},void 0,void 0,9)},Bc=e=>{He(e,"LessOrEqual",{scalar:(t,r)=>`u32(${t}<=${r})`,vector:(t,r)=>`vec4<u32>(${t}<=${r})`},void 0,void 0,9)}}),yu,_u,wu,bu,Nc,Mc,ry=P(()=>{J(),re(),ve(),ie(),yu=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");let r=0,i=e[r],a=i.dataType,n=i.dims.length;e.forEach((s,u)=>{if(u!==r){if(s.dataType!==a)throw new Error("input tensors should be one type");if(s.dims.length!==n)throw new Error("input tensors should have the same shape");s.dims.forEach((d,p)=>{if(p!==t&&d!==i.dims[p])throw new Error("non concat dimensions must match")})}})},_u=(e,t)=>`
  fn calculateInputIndex(index: u32) -> u32 {
    let sizeInConcatAxis = array<u32, ${e}u>(${t});
    for (var i: u32 = 0u; i < ${e}; i += 1u ) {
      if (index < sizeInConcatAxis[i]) {
        return i;
      }
    }
    return ${e}u;
  }`,wu=(e,t)=>{let r=e.length,i=[];for(let a=0;a<r;++a){let n=t.setByOffset("global_idx",e[a].getByIndices("indices"));r===1?i.push(n):a===0?i.push(`if (inputIndex == ${a}u) { ${n} }`):a===r-1?i.push(`else { ${n} }`):i.push(`else if (inputIndex == ${a}) { ${n} }`)}return i.join(`
`)},bu=(e,t,r,i)=>{let a=O.size(r),n=new Array(e.length),s=new Array(e.length),u=0,d=[],p=[],m=[{type:12,data:a}];for(let $=0;$<e.length;++$)u+=e[$].dims[t],n[$]=u,p.push(e[$].dims.length),s[$]=N(`input${$}`,i,p[$]),d.push("rank"),m.push({type:12,data:n[$]});for(let $=0;$<e.length;++$)m.push(...K(e[$].dims));m.push(...K(r));let h=F("output",i,r.length),g=h.indicesGet("indices",t),y=Array.from(Array(n.length).keys()).map($=>`uniforms.sizeInConcatAxis${$}`).join(","),_=$=>`

  ${(()=>{$.registerUniform("outputSize","u32");for(let T=0;T<e.length;T++)$.registerUniform(`sizeInConcatAxis${T}`,"u32");return $.declareVariables(...s,h)})()}

  ${_u(n.length,y)}

  ${$.mainStart()}
    ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

    var indices = ${h.offsetToIndices("global_idx")};

    let inputIndex = calculateInputIndex(${g});
    if (inputIndex != 0u) {
      let sizeInConcatAxis = array<u32, ${n.length}u>(${y});
      ${g} -= sizeInConcatAxis[inputIndex - 1u];
    }

    ${wu(s,h)}
  }`;return{name:"Concat",shaderCache:{hint:`${t}`,inputDependencies:d},getRunData:()=>({outputs:[{dims:r,dataType:i}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:m}),getShaderSource:_}},Nc=(e,t)=>{let r=e.inputs,i=r[0].dims,a=O.normalizeAxis(t.axis,i.length);yu(r,a);let n=i.slice();n[a]=r.reduce((u,d)=>u+(d.dims.length>a?d.dims[a]:0),0);let s=r.filter(u=>O.size(u.dims)>0);e.compute(bu(s,a,n,r[0].dataType),{inputs:s})},Mc=e=>he({axis:e.axis})}),zt,Ct,At,Ha,Rt=P(()=>{J(),re(),zt=(e,t,r="f32")=>{switch(e.activation){case"Relu":return`value = max(value, ${t}(0.0));`;case"Sigmoid":return`value = (${t}(1.0) / (${t}(1.0) + exp(-value)));`;case"Clip":return`value = clamp(value, ${t}(${r}(uniforms.clip_min)), ${t}(${r}(uniforms.clip_max)));`;case"HardSigmoid":return`value = max(${t}(0.0), min(${t}(1.0), ${r}(uniforms.alpha) * value + ${r}(uniforms.beta)));`;case"LeakyRelu":return`value = select(${r}(uniforms.alpha) * value, value, value >= ${t}(0.0));`;case"Tanh":return`let e2x = exp(-2.0 * abs(value));
              value = sign(value) * (1.0 - e2x) / (1.0 + e2x);
        `;case"":return"";default:throw new Error(`Unsupported activation ${e.activation}`)}},Ct=(e,t)=>{e.activation==="Clip"?t.push({type:1,data:e.clipMax},{type:1,data:e.clipMin}):e.activation==="HardSigmoid"?t.push({type:1,data:e.alpha},{type:1,data:e.beta}):e.activation==="LeakyRelu"&&t.push({type:1,data:e.alpha})},At=(e,t)=>{e.activation==="Clip"?t.push({name:"clip_max",type:"f32"},{name:"clip_min",type:"f32"}):e.activation==="HardSigmoid"?t.push({name:"alpha",type:"f32"},{name:"beta",type:"f32"}):e.activation==="LeakyRelu"&&t.push({name:"alpha",type:"f32"})},Ha=e=>{let t=e?.activation||"";if(t==="HardSigmoid"){let[r,i]=e?.activation_params||[.2,.5];return{activation:t,alpha:r,beta:i}}else if(t==="Clip"){let[r,i]=e?.activation_params||[up,lp];return{activation:t,clipMax:i,clipMin:r}}else if(t==="LeakyRelu"){let[r]=e?.activation_params||[.01];return{activation:t,alpha:r}}return{activation:t}}}),Ie,Dc,Fa=P(()=>{Ie=(e,t)=>{switch(e){case 1:return t;case 2:return`vec2<${t}>`;case 3:return`vec3<${t}>`;case 4:return`vec4<${t}>`;default:throw new Error(`${e}-component is not supported.`)}},Dc=e=>`
      ${e?"value = value + getBiasByOutputCoords(coords);":""}
      `}),Uc,iy=P(()=>{Uc=e=>`
fn getIndexFromCoords4D(coords : vec4<i32>, shape : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
      shape.y * shape.z * shape.w, shape.z * shape.w, shape.w, 1));
}
fn getOutputIndexFromCoords(coords : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
    i32(${e}.x), i32(${e}.y), i32(${e}.z), 1));
}
`}),or,ja,Ka=P(()=>{J(),re(),ie(),Rt(),or=(e,t,r,i,a)=>{let n=i-r;return`
      ${Array.from({length:r}).map((s,u)=>`
      if (${j(t.shape,u,t.rank)} != 1) {
        ${t.indicesSet(e,u,j(a,u+n,i))}
      } else {
        ${t.indicesSet(e,u,0)}
      }`).join("")}
`},ja=(e,t,r,i,a=!1,n)=>{let s=e[0].dims,u=e[1].dims,d=s[s.length-2],p=u[u.length-1],m=s[s.length-1],h=$e(p),g=$e(m),y=$e(d),_=O.size(r)/h/y,$=e.length>2,T=i?i.slice(0,-2):r.slice(0,-2),x=[O.size(T),d,p],w=[{type:12,data:_},{type:12,data:d},{type:12,data:p},{type:12,data:m}];Ct(t,w),w.push(...K(T,s,u)),$&&w.push(...K(e[2].dims)),w.push(...K(x));let I=S=>{let E=Wa("batch_dims",e[0].dataType,T.length),C=N("a",e[0].dataType,s.length,g),A=N("b",e[1].dataType,u.length,h),v=F("output",e[0].dataType,x.length,h),U=Te(v.type.tensor),q=zt(t,v.type.value,U),Y=[C,A],H="";if($){let D=a?h:1;Y.push(N("bias",e[2].dataType,e[2].dims.length,D)),H=`${a?`value += bias[col / ${D}];`:`value += ${v.type.value}(bias[row + i]);`}`}let Q=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"}];At(t,Q);let R=()=>{let D=`var a_data: ${C.type.value};`;for(let G=0;G<g;G++)D+=`
              let b_data${G} = b[(b_offset + (k + ${G}) * uniforms.N + col) / ${h}];`;for(let G=0;G<y;G++){D+=`a_data = a[(a_offset + (row + ${G}) * uniforms.K + k) / ${g}];`;for(let ee=0;ee<g;ee++)D+=`
            values[${G}] = fma(${A.type.value}(a_data${g===1?"":`[${ee}]`}), b_data${ee}, values[${G}]);
`}return D};return`
  ${S.registerUniforms(Q).registerInternalVariables(E).declareVariables(...Y,v)}
  ${S.mainStart()}
    ${S.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let col = (global_idx % (uniforms.N / ${h})) * ${h};
    var index1 = global_idx / (uniforms.N / ${h});
    let stride1 = uniforms.M / ${y};
    let row = (index1 % stride1) * ${y};
    let batch = index1 / stride1;

    ${r.length===2?"":`let batch_indices = ${E.offsetToIndices("batch")};`}

    var a_indices: ${C.type.indices};
    ${or("a_indices",C,C.rank-2,E.rank,"batch_indices")}
    ${C.indicesSet("a_indices",C.rank-2,0)}
    ${C.indicesSet("a_indices",C.rank-1,0)}
    let a_offset = ${C.indicesToOffset("a_indices")};

    var b_indices: ${A.type.indices};
    ${or("b_indices",A,A.rank-2,E.rank,"batch_indices")}
    ${A.indicesSet("b_indices",A.rank-2,0)}
    ${A.indicesSet("b_indices",A.rank-1,0)}
    let b_offset = ${A.indicesToOffset("b_indices")};
    var values: array<${v.type.value}, ${y}>;
    for (var k: u32 = 0u; k < uniforms.K; k = k + ${g}) {
      ${R()}
    }
    for (var i = 0u; i < ${y}u; i++) {
      var value = values[i];
      ${H}
      ${q}
      let cur_indices = ${v.type.indices}(batch, row + i, col);
      let offset = ${v.indicesToOffset("cur_indices")};
      ${v.setByOffset(`offset / ${h}`,"value")};
    }
  }
  `};return{name:"MatMulNaive",shaderCache:{hint:`${t.activation};${h};${g};${y};${a}`,inputDependencies:$?["rank","rank","rank"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:n?n(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(_/64)},programUniforms:w}),getShaderSource:I}}}),$u,vu,va,Pi,xu,xa,Su,Vr,Qa=P(()=>{J(),re(),ie(),Rt(),Ka(),Fa(),$u=(e,t)=>e?`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          kStart + inputRow,
          globalRowStart / innerElementSize + inputCol${t?", batchIndices":""});
        `:`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          globalRow + innerRow,
          kStart / innerElementSize + inputCol${t?", batchIndices":""});
        `,vu=(e,t)=>e?`
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
        }`,va=(e,t,r="f32",i,a=!1,n=32,s=!1,u=32)=>{let d=t[1]*e[1],p=t[0]*e[0],m=a?d:n,h=a?n:d,g=m/t[0],y=n/t[1];if(!((a&&g===4&&e[1]===4||!a&&(g===3||g===4))&&m%t[0]===0&&n%t[1]===0&&e[0]===4))throw new Error(`If transposeA ${a} is true, innerElementSize ${g} and workPerThread[1] ${e[1]} must be 4.
      Otherwise, innerElementSize ${g} must be 3 or 4.
  tileAWidth ${m} must be divisible by workgroupSize[0]${t[0]}. tileInner ${n} must be divisible by workgroupSize[1] ${t[1]}. colPerThread ${e[0]} must be 4.`);return`
var<workgroup> mm_Asub: array<array<vec${g}<${r}>, ${m/g}>, ${h}>;
var<workgroup> mm_Bsub: array<array<vec4<${r}>, ${p/e[0]}>, ${n}>;

const rowPerThread = ${e[1]};
const colPerThread = ${e[0]};
const innerElementSize = ${g};
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
  ${i?`let batchIndices = ${i.offsetToIndices("u32(batch)")};`:""}
  let globalRowStart = i32(workgroupId.y) * ${d};

  let num_tiles = ${s?`${Math.ceil(u/n)}`:"(uniforms.dim_inner - 1) / tileInner + 1"};
  var kStart = ${s?`i32(globalId.z) * ${u}`:"0"};

  var acc: array<vec4<${r}>, rowPerThread>;

  // Loop over shared dimension.
  let tileRowB = localRow * ${y};
  for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
          let inputRow = tileRow + innerRow;
          let inputCol = tileCol;
          ${$u(a,i)}
      }

      // Load one tile of B into local memory.
      for (var innerRow = 0; innerRow < ${y}; innerRow = innerRow + 1) {
          let inputRow = tileRowB + innerRow;
          let inputCol = tileCol;
          mm_Bsub[inputRow][inputCol] = mm_readB(batch, kStart + inputRow, globalCol${i?", batchIndices":""});
      }
      kStart = kStart + tileInner;
      workgroupBarrier();

      // Compute acc values for a single thread.
      for (var k = 0; k < tileInner / innerElementSize; k = k + 1) {
          let BCached0 = mm_Bsub[k * innerElementSize][tileCol];
          let BCached1 = mm_Bsub[k * innerElementSize + 1][tileCol];
          let BCached2 = mm_Bsub[k * innerElementSize + 2][tileCol];
          ${g===3?"":"let BCached3 = mm_Bsub[k * innerElementSize + 3][tileCol];"}

          ${vu(a,g)}
      }

      workgroupBarrier();
  }

  for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      mm_write(batch, globalRow + innerRow, globalCol, acc[innerRow]);
  }
}`},Pi=(e,t)=>e?`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              kStart + inputRow,
              globalRowStart + inputCol${t?", batchIndices":""});
            `:`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              globalRowStart + inputRow,
              kStart + inputCol${t?", batchIndices":""});
            `,xu=e=>e?"let ACached = mm_Asub[k][tileRow + innerRow];":"let ACached = mm_Asub[tileRow + innerRow][k];",xa=(e,t,r="f32",i,a=!1,n=32,s=!1,u=32,d=!1)=>{let p=e[1]*t[1],m=e[0]*t[0],h=a?p:n,g=a?n:p;if(!(g%t[1]===0&&h%t[0]===0&&n%t[1]===0))throw new Error(`tileAHight ${g} must be divisible by workgroupSize[1]${t[1]}, tileAWidth ${h} must be divisible by workgroupSize[0]${t[0]}, tileInner ${n} must be divisible by workgroupSize[1]${t[1]}`);let y=g/t[1],_=h/t[0],$=n/t[1],T=d?`
    let localRow = i32(localId.y);
    let localCol = i32(localId.x);
    let globalRowStart = i32(workgroupId.y) * ${p};
    let globalColStart = i32(workgroupId.x) * ${m};

    // Loop over shared dimension.
    for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var inputRow = localRow; inputRow < ${g}; inputRow = inputRow + ${t[1]}) {
        for (var inputCol = localCol; inputCol < ${h}; inputCol = inputCol + ${t[0]}) {
          ${Pi(a,i)}
        }
      }
      // Load one tile of B into local memory.
      for (var inputRow = localRow; inputRow < ${n}; inputRow = inputRow + ${t[1]}) {
            for (var inputCol = localCol; inputCol < ${m}; inputCol = inputCol + ${t[0]}) {
          mm_Bsub[inputRow][inputCol] = mm_readB(batch,
            kStart + inputRow,
            globalColStart + inputCol${i?", batchIndices":""});
        }
      }
      kStart = kStart + tileInner;
      workgroupBarrier();

      // Compute acc values for a single thread.
      var BCached : array<${r}, colPerThread>;
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
let globalRowStart = i32(workgroupId.y) * ${p};

let tileRowA = i32(localId.y) * ${y};
let tileColA = i32(localId.x) * ${_};
let tileRowB = i32(localId.y) * ${$};
// Loop over shared dimension.
for (var t = 0; t < num_tiles; t = t + 1) {
  // Load one tile of A into local memory.
  for (var innerRow = 0; innerRow < ${y}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < ${_}; innerCol = innerCol + 1) {
      let inputRow = tileRowA + innerRow;
      let inputCol = tileColA + innerCol;
      ${Pi(a,i)}
    }
  }

  // Load one tile of B into local memory.
  for (var innerRow = 0; innerRow < ${$}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
      let inputRow = tileRowB + innerRow;
      let inputCol = tileCol + innerCol;
      mm_Bsub[inputRow][inputCol] = mm_readB(batch,
        kStart + inputRow,
        globalCol + innerCol${i?", batchIndices":""});
    }
  }
  kStart = kStart + tileInner;
  workgroupBarrier();

  // Compute acc values for a single thread.
  var BCached : array<${r}, colPerThread>;
  for (var k = 0; k < tileInner; k = k + 1) {
    for (var inner = 0; inner < colPerThread; inner = inner + 1) {
      BCached[inner] = mm_Bsub[k][tileCol + inner];
    }

    for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      ${xu(a)}
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
  var<workgroup> mm_Asub : array<array<${r}, ${h}>, ${g}>;
  var<workgroup> mm_Bsub : array<array<${r}, ${m}>, ${n}>;
  const rowPerThread = ${e[1]};
  const colPerThread = ${e[0]};
  const tileInner = ${n};

@compute @workgroup_size(${t[0]}, ${t[1]}, ${t[2]})
fn main(@builtin(local_invocation_id) localId : vec3<u32>,
        @builtin(global_invocation_id) globalId : vec3<u32>,
        @builtin(workgroup_id) workgroupId : vec3<u32>) {
    let batch = ${s?"0":"i32(globalId.z)"};
    ${i?`let batchIndices = ${i.offsetToIndices("u32(batch)")};`:""}
    let num_tiles = ${s?`${Math.ceil(u/n)}`:"(uniforms.dim_inner - 1) / tileInner + 1"};
    var kStart = ${s?`i32(globalId.z) * ${u}`:"0"};

    var acc : array<array<${r}, colPerThread>, rowPerThread>;
    ${T}
  }
`},Su=(e,t,r,i,a=!1)=>{let[n,s,u,d]=i,p=Te(i[0].type.tensor);return`
    fn mm_readA(batch: i32, row: i32, colIn: i32, batchIndices: ${n.type.indices}) -> ${Ie(e,p)} {
      var value = ${Ie(e,p)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_a_outer && col < uniforms.dim_inner)
      {
        var aIndices: ${s.type.indices};
        ${or("aIndices",s,s.rank-2,n.rank,"batchIndices")}
        ${s.indicesSet("aIndices",s.rank-2,"u32(row)")}
        ${s.indicesSet("aIndices",s.rank-1,"u32(colIn)")}
        value = ${s.getByIndices("aIndices")};
      }
      return value;
    }

    fn mm_readB(batch: i32, row: i32, colIn: i32, batchIndices: ${n.type.indices}) -> ${Ie(e,p)} {
      var value = ${Ie(e,p)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_inner && col < uniforms.dim_b_outer)
      {
        var bIndices: ${u.type.indices};
        ${or("bIndices",u,u.rank-2,n.rank,"batchIndices")}
        ${u.indicesSet("bIndices",u.rank-2,"u32(row)")}
        ${u.indicesSet("bIndices",u.rank-1,"u32(colIn)")}
        value = ${u.getByIndices("bIndices")};
      }
      return value;
    }

    fn mm_write(batch: i32, row: i32, colIn: i32, valueIn: ${Ie(e,p)}) {
      let col = colIn * ${e};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer) {
        var value = valueIn;
        let coords = vec3<i32>(batch, row, colIn);
        ${t?`value = value + ${a?"bias[colIn]":`${Ie(e,p)}(bias[row])`};`:""}
        ${r}
        ${d.setByIndices("vec3<u32>(coords)","value")}
      }
    }
    `},Vr=(e,t,r,i,a=!1,n)=>{let s=e[0].dims,u=e[1].dims,d=s.slice(0,-2),p=u.slice(0,-2),m=i?i.slice(0,-2):r.slice(0,-2),h=O.size(m),g=s[s.length-2],y=s[s.length-1],_=u[u.length-1],$=y%4===0&&_%4===0,T=g<=8?[4,1,1]:[4,4,1],x=[8,8,1],w=[Math.ceil(_/x[0]/T[0]),Math.ceil(g/x[1]/T[1]),Math.ceil(h/x[2]/T[2])],I=$?4:1,S=[...d,g,y/I],E=S.length,C=[...p,y,_/I],A=C.length,v=[h,g,_/I],U=[{type:6,data:g},{type:6,data:_},{type:6,data:y}];Ct(t,U),U.push(...K(m,S,C));let q=["rank","rank"],Y=e.length>2;Y&&(U.push(...K(e[2].dims)),q.push("rank")),U.push(...K(v));let H=Q=>{let R=m.length,D=Wa("batchDims",e[0].dataType,R,1),G=Te(e[0].dataType),ee=N("a",e[0].dataType,E,I),Z=N("b",e[1].dataType,A,I),X=F("result",e[0].dataType,v.length,I),de=[ee,Z];if(Y){let Ae=a?I:1;de.push(N("bias",e[2].dataType,e[2].dims.length,Ae))}let M=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"}];At(t,M);let L=Te(X.type.tensor),te=zt(t,X.type.value,L),oe=Su(I,Y,te,[D,ee,Z,X],a);return`
  ${Q.registerUniforms(M).registerInternalVariables(D).declareVariables(...de,X)}
  ${oe}
  ${$?va(T,x,G,D):xa(T,x,G,D)}
                   `};return{name:"MatMul",shaderCache:{hint:`${T};${t.activation};${$};${a}`,inputDependencies:q},getRunData:()=>({outputs:[{dims:n?n(r):r,dataType:e[0].dataType}],dispatchGroup:{x:w[0],y:w[1],z:w[2]},programUniforms:U}),getShaderSource:H}}}),Tu,Pc,ay=P(()=>{J(),nt(),ie(),Rt(),Fa(),iy(),Qa(),Tu=(e,t,r,i,a=!1,n,s=4,u=4,d=4,p="f32")=>{let m=U=>{switch(U){case 1:return"resData = x[xIndex];";case 3:return`resData = vec3<${p}>(x[xIndex], x[xIndex + 1], x[xIndex + 2]);`;case 4:return"resData = x[xIndex / 4];";default:throw new Error(`innerElementSize ${U} is not supported.`)}},h=U=>{switch(U){case 1:return"return w[row * i32(uniforms.w_shape[3]) + colIn];";case 4:return"return w[row * i32(uniforms.w_shape[3]) / 4 + colIn];";default:throw new Error(`innerElementSize ${U} is not supported.`)}},g=e?`
    let coord = vec4<i32>(batch, xRow, xCol, xCh);
    `:`
    let coord = vec4<i32>(batch, xCh, xRow, xCol);
    `,y=e?`
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
    `,_=e?"i32(uniforms.x_shape[1])":"i32(uniforms.x_shape[2])",$=e?"i32(uniforms.x_shape[2])":"i32(uniforms.x_shape[3])",T=e?"row":"col",x=e?"col":"row",w=`
    let inChannels = i32(uniforms.w_shape[2]);
    let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
    let outRow = ${T} / outWidth;
    let outCol = ${T} % outWidth;

    let WRow = ${x} / (i32(uniforms.w_shape[1]) * inChannels);
    let WCol = ${x} / inChannels % i32(uniforms.w_shape[1]);
    let xRow = outRow * uniforms.stride[0] + uniforms.dilation[0] * WRow - uniforms.pad[0];
    let xCol = outCol * uniforms.stride[1] + uniforms.dilation[1] * WCol - uniforms.pad[1];
    let xCh = ${x} % inChannels;
    var resData = ${Ie(s,p)}(0.0);
    // The bounds checking is always needed since we use it to pad zero for
    // the 'same' padding type.
    if (xRow >= 0 && xRow < ${_} && xCol >= 0 && xCol < ${$}) {
      ${g}
      let xIndex = getIndexFromCoords4D(coord, vec4<i32>(uniforms.x_shape));
      ${m(s)}
    }
    return resData;`,I=e?t&&i?`
    let col = colIn * ${s};
    ${w}`:`
    let col = colIn * ${s};
    if (row < uniforms.dim_a_outer && col < uniforms.dim_inner) {
      ${w}
    }
    return ${Ie(s,p)}(0.0);`:i&&r?`
    let col = colIn * ${s};
    ${w}`:`
    let col = colIn * ${s};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${w}
    }
    return ${Ie(s,p)}(0.0);`,S=e?i&&r?h(u):`
    let col = colIn * ${u};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${h(u)}
    }
    return ${Ie(u,p)}(0.0);`:`
    let col = colIn * ${u};
    if (row < uniforms.dim_inner && col < uniforms.dim_a_outer) {
      ${h(u)}
    }
    return ${Ie(u,p)}(0.0);`,E=Ie(d,p),C=Ie(e?s:u,p),A=Ie(e?u:s,p),v=zt(n,E,p);return`
    fn mm_readA(batch: i32, row : i32, colIn : i32) -> ${C} {
      ${e?I:S}
    }

    fn mm_readB(batch: i32, row : i32, colIn : i32) -> ${A} {
      ${e?S:I}
    }

    fn mm_write(batch: i32, row : i32, colIn : i32, valueIn : ${E}) {
      let col = colIn * ${d};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer)
      {
      var value = valueIn;
      let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
      ${y}
      ${Dc(a)}
      ${v}
      setOutputAtCoords(coords[0], coords[1], coords[2], coords[3], value);
      }
    }`},Pc=(e,t,r,i,a,n,s,u,d)=>{let p=t.format==="NHWC",m=p?e[0].dims[3]:e[0].dims[1],h=r[0],g=p?r[2]:r[3],y=p?r[1]:r[2],_=p?r[3]:r[1],$=p&&(m%4===0||m%3===0)&&_%4===0,T=p?_:g*y,x=p?g*y:_,w=[8,8,1],I=i<=8?[4,1,1]:[4,4,1],S=[Math.ceil(T/w[0]/I[0]),Math.ceil(x/w[1]/I[1]),Math.ceil(h/w[2]/I[2])];le("verbose",()=>`[conv2d_mm_webgpu] dispatch = ${S}`);let E=$?p&&m%4!==0?3:4:1,C=w[1]*I[1],A=w[0]*I[0],v=Math.max(w[0]*E,w[1]),U=i%C===0,q=a%A===0,Y=n%v===0,H=$?[E,4,4]:[1,1,1],Q=[{type:6,data:i},{type:6,data:a},{type:6,data:n},{type:6,data:[t.pads[0],t.pads[1]]},{type:6,data:t.strides},{type:6,data:t.dilations}];Ct(t,Q),Q.push(...K(e[0].dims,e[1].dims));let R=["rank","rank"];s&&(Q.push(...K(e[2].dims)),R.push("rank")),Q.push(...K(r));let D=G=>{let ee=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"},{name:"pad",type:"i32",length:2},{name:"stride",type:"i32",length:2},{name:"dilation",type:"i32",length:2}];At(t,ee);let Z=$?4:1,X=Te(e[0].dataType),de=`
      fn setOutputAtIndex(flatIndex : i32, value : ${$?`vec4<${X}>`:X}) {
        result[flatIndex] = ${$?`vec4<${X}>`:X}(value);
      }
      fn setOutputAtCoords(d0 : i32, d1 : i32, d2 : i32, d3 : i32, value : ${$?`vec4<${X}>`:X}) {
        let flatIndex = getOutputIndexFromCoords(vec4<i32>(d0, d1, d2, d3));
        setOutputAtIndex(flatIndex ${$?"/ 4":""}, value);
      }`,M=N("x",e[0].dataType,e[0].dims.length,E===3?1:E),L=N("w",e[1].dataType,e[1].dims.length,Z),te=[M,L],oe=F("result",e[0].dataType,r.length,Z);if(s){let Ae=N("bias",e[2].dataType,e[2].dims.length,Z);te.push(Ae),de+=`
        fn getBiasByOutputCoords(coords : vec4<i32>) -> ${$?`vec4<${X}>`:X} {
          return bias[coords.${p?"w":"y"}${$?"/ 4":""}];
        }`}return`
        ${Uc("uniforms.result_strides")}
        //struct Uniforms { xShape : vec4<i32>, wShape : vec4<i32>, outShape : vec4<i32>,
        //  outShapeStrides: vec3<i32>, filterDims : vec2<i32>, pad : vec2<i32>, stride : vec2<i32>,
        //  dilation : vec2<i32>, dimAOuter : i32, dimBOuter : i32, dimInner : i32 };
        ${G.registerUniforms(ee).declareVariables(...te,oe)}
        ${de}
        ${Tu(p,U,q,Y,s,t,H[0],H[1],H[2],X)}
        ${$?va(I,w,X,void 0,!p,v):xa(I,w,X,void 0,!p,v,!1,void 0,u)}`};return{name:"Conv2DMatMul",shaderCache:{hint:`${t.cacheKey};${E};${$};${U};${q};${Y};${C};${A};${v}`,inputDependencies:R},getRunData:()=>({outputs:[{dims:d?d(r):r,dataType:e[0].dataType}],dispatchGroup:{x:S[0],y:S[1],z:S[2]},programUniforms:Q}),getShaderSource:D}}}),ku,qi,Yt,Iu,Wi,Eu,qc,Wc,ny=P(()=>{J(),nt(),re(),ie(),Rt(),Fa(),ku=e=>{let t=1;for(let r=0;r<e.length;r++)t*=e[r];return t},qi=e=>typeof e=="number"?[e,e,e]:e,Yt=(e,t)=>t<=1?e:e+(e-1)*(t-1),Iu=(e,t,r,i=1)=>{let a=Yt(t,i);return Math.floor((e[0]*(r-1)-r+a)/2)},Wi=(e,t,r,i,a)=>{a==null&&(a=Iu(e,t[0],i[0]));let n=[0,0,0,r];for(let s=0;s<3;s++)e[s]+2*a>=t[s]&&(n[s]=Math.trunc((e[s]-t[s]+2*a)/i[s]+1));return n},Eu=(e,t,r,i,a,n,s,u,d,p)=>{let m,h,g,y;if(e==="VALID"&&(e=0),typeof e=="number"){m={top:e,bottom:e,left:e,right:e,front:e,back:e};let _=Wi([t,r,i,1],[u,d,p],1,[a,n,s],e);h=_[0],g=_[1],y=_[2]}else if(Array.isArray(e)){if(!e.every(($,T,x)=>$===x[0]))throw Error(`Unsupported padding parameter: ${e}`);m={top:e[0],bottom:e[1],left:e[2],right:e[3],front:e[4],back:e[5]};let _=Wi([t,r,i,1],[u,d,p],1,[a,n,s],e[0]);h=_[0],g=_[1],y=_[2]}else if(e==="SAME_UPPER"){h=Math.ceil(t/a),g=Math.ceil(r/n),y=Math.ceil(i/s);let _=(h-1)*a+u-t,$=(g-1)*n+d-r,T=(y-1)*s+p-i,x=Math.floor(_/2),w=_-x,I=Math.floor($/2),S=$-I,E=Math.floor(T/2),C=T-E;m={top:I,bottom:S,left:E,right:C,front:x,back:w}}else throw Error(`Unknown padding parameter: ${e}`);return{padInfo:m,outDepth:h,outHeight:g,outWidth:y}},qc=(e,t,r,i,a,n=!1,s="channelsLast")=>{let u,d,p,m,h;if(s==="channelsLast")[u,d,p,m,h]=e;else if(s==="channelsFirst")[u,h,d,p,m]=e;else throw new Error(`Unknown dataFormat ${s}`);let[g,,y,_,$]=t,[T,x,w]=qi(r),[I,S,E]=qi(i),C=Yt(y,I),A=Yt(_,S),v=Yt($,E),{padInfo:U,outDepth:q,outHeight:Y,outWidth:H}=Eu(a,d,p,m,T,x,w,C,A,v),Q=n?g*h:g,R=[0,0,0,0,0];return s==="channelsFirst"?R=[u,Q,q,Y,H]:s==="channelsLast"&&(R=[u,q,Y,H,Q]),{batchSize:u,dataFormat:s,inDepth:d,inHeight:p,inWidth:m,inChannels:h,outDepth:q,outHeight:Y,outWidth:H,outChannels:Q,padInfo:U,strideDepth:T,strideHeight:x,strideWidth:w,filterDepth:y,filterHeight:_,filterWidth:$,effectiveFilterDepth:C,effectiveFilterHeight:A,effectiveFilterWidth:v,dilationDepth:I,dilationHeight:S,dilationWidth:E,inShape:e,outShape:R,filterShape:t}},Wc=(e,t,r,i,a,n)=>{let s=n==="channelsLast";s?e[0].dims[3]:e[0].dims[1];let u=[64,1,1],d={x:r.map((T,x)=>x)},p=[Math.ceil(ku(d.x.map(T=>r[T]))/u[0]),1,1];le("verbose",()=>`[conv3d_naive_webgpu] dispatch = ${p}`);let m=1,h=O.size(r),g=[{type:12,data:h},{type:12,data:i},{type:12,data:a},{type:12,data:t.strides},{type:12,data:t.dilations}];Ct(t,g),g.push(...K(e[0].dims,e[1].dims));let y=["rank","rank"],_=e.length===3;_&&(g.push(...K(e[2].dims)),y.push("rank")),g.push(...K(r));let $=T=>{let x=[{name:"output_size",type:"u32"},{name:"filter_dims",type:"u32",length:i.length},{name:"pads",type:"u32",length:a.length},{name:"strides",type:"u32",length:t.strides.length},{name:"dilations",type:"u32",length:t.dilations.length}];At(t,x);let w=1,I=Te(e[0].dataType),S=N("x",e[0].dataType,e[0].dims.length,m),E=N("W",e[1].dataType,e[1].dims.length,w),C=[S,E],A=F("result",e[0].dataType,r.length,w),v="";if(_){let Y=N("bias",e[2].dataType,e[2].dims.length,w);C.push(Y),v+=`
        fn getBiasByOutputCoords(coords : array<u32, 5>) -> ${I} {
          return bias[${s?j("coords",4,5):j("coords",1,5)}];
        }`}let U=Ie(m,I),q=zt(t,U,I);return`
            ${v}
            fn getX(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${S.getByIndices("aIndices")};
            }
            fn getW(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${E.getByIndices("aIndices")};
            }
          ${T.registerUniforms(x).declareVariables(...C,A)}
          ${T.mainStart()}
          ${T.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
              let coords = ${A.offsetToIndices("global_idx")};
              let batch = ${j("coords",0,S.rank)};
              let d2 = ${s?j("coords",S.rank-1,S.rank):j("coords",1,S.rank)};
              let xFRCCorner = vec3<u32>(${s?j("coords",1,S.rank):j("coords",2,S.rank)},
              ${s?j("coords",2,S.rank):j("coords",3,S.rank)},
              ${s?j("coords",3,S.rank):j("coords",4,S.rank)}) * uniforms.strides - uniforms.pads;
              let xFCorner = xFRCCorner.x;
              let xRCorner = xFRCCorner.y;
              let xCCorner = xFRCCorner.z;
              let xShapeY = ${s?j("uniforms.x_shape",1,S.rank):j("uniforms.x_shape",2,S.rank)};
              let xShapeZ = ${s?j("uniforms.x_shape",2,S.rank):j("uniforms.x_shape",3,S.rank)};
              let xShapeW = ${s?j("uniforms.x_shape",3,S.rank):j("uniforms.x_shape",4,S.rank)};
              let xShapeU = ${s?j("uniforms.x_shape",4,S.rank):j("uniforms.x_shape",1,S.rank)};
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
              ${_?"value = value + getBiasByOutputCoords(coords)":""};
              ${q}
              result[global_idx] = f32(value);
          }`};return{name:"Conv3DNaive",shaderCache:{hint:`${t.cacheKey};${s};${m};${_}`,inputDependencies:y},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:p[0],y:p[1],z:p[2]},programUniforms:g}),getShaderSource:$}}}),Lc,Vc,sy=P(()=>{J(),re(),ie(),Rt(),Lc=(e,t,r,i)=>{let a=e.length>2,n=a?"value += b[output_channel];":"",s=e[0].dims,u=e[1].dims,d=t.format==="NHWC",p=d?r[3]:r[1],m=p/t.group,h=d&&m>=4?$e(p):1,g=O.size(r)/h,y=[{type:12,data:g},{type:12,data:t.dilations},{type:12,data:[t.strides[0],t.strides[1]]},{type:12,data:[t.pads[0],t.pads[1]]},{type:12,data:m}];Ct(t,y),y.push(...K(s,[u[0],u[1],u[2],u[3]/h]));let _=a?["rank","rank","rank"]:["rank","rank"];y.push(...K([r[0],r[1],r[2],r[3]/h]));let $=T=>{let x=F("output",e[0].dataType,r.length,h),w=Te(x.type.tensor),I=zt(t,x.type.value,w),S=N("x",e[0].dataType,s.length),E=N("w",e[1].dataType,u.length,h),C=[S,E];a&&C.push(N("b",e[2].dataType,e[2].dims,h));let A=[{name:"output_size",type:"u32"},{name:"dilations",type:"u32",length:t.dilations.length},{name:"strides",type:"u32",length:2},{name:"pads",type:"u32",length:2},{name:"output_channels_per_group",type:"u32"}];At(t,A);let v=d?`
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
            let xVal = ${S.get("batch","xHeight","xWidth","input_channel")};
            let wVal = ${E.get("wHeight","wWidth","wInChannel","output_channel")};
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

            let xVal = ${S.get("batch","input_channel","xHeight","xWidth")};
            let wVal = ${E.get("output_channel","wInChannel","wHeight","wWidth")};
            value += xVal * wVal;
          }
        }
      }
      `;return`
  ${T.registerUniforms(A).declareVariables(...C,x)}

  ${T.mainStart()}
    ${T.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let outputIndices = ${x.offsetToIndices("global_idx")};
    let batch: u32 = outputIndices[0];
    let output_channel: u32 = outputIndices[${d?3:1}];
    let xRCCorner: vec2<u32> = vec2<u32>(outputIndices[${d?1:2}], outputIndices[${d?2:3}]) * uniforms.strides - uniforms.pads;
    let group_id: u32 = output_channel * ${h} / uniforms.output_channels_per_group;
    var in_channel_offset = group_id * uniforms.w_shape[${d?2:1}];

    var value: ${x.type.value} = ${x.type.value}(0);
    ${v}
    ${n}
    ${I}
    ${x.setByOffset("global_idx","value")}
  }`};return{name:"GroupedConv",shaderCache:{hint:`${t.cacheKey}_${h}`,inputDependencies:_},getRunData:()=>({outputs:[{dims:i?i(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(g/64)},programUniforms:y}),getShaderSource:$}},Vc=(e,t,r,i)=>{let a=e.length>2,n=$e(r[3]),s=$e(r[2]),u=O.size(r)/n/s,d=[e[0].dims[0],e[0].dims[1],e[0].dims[2],e[0].dims[3]/n],p=[e[1].dims[0],e[1].dims[1],e[1].dims[2],e[1].dims[3]/n],m=[r[0],r[1],r[2],r[3]/n],h=[{type:12,data:u},{type:6,data:[t.strides[0],t.strides[1]]},{type:6,data:[t.pads[0],t.pads[1]]}];Ct(t,h),h.push(...K(d,p,m));let g=(s-1)*t.strides[1]+p[1],y=_=>{let $=F("output",e[0].dataType,m.length,n),T=Te($.type.tensor),x=zt(t,$.type.value,T),w=N("x",e[0].dataType,d.length,n),I=N("w",e[1].dataType,p.length,n),S=[w,I];a&&S.push(N("b",e[2].dataType,e[2].dims,n));let E=a?"value += b[output_channel];":"",C=[{name:"output_size",type:"u32"},{name:"strides",type:"i32",length:2},{name:"pads",type:"i32",length:2}];return At(t,C),`
  ${_.registerUniforms(C).declareVariables(...S,$)}
  ${_.mainStart()}
    ${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let width0 = uniforms.output_shape[3];
    let output_channel = global_idx % width0;
    var index1 = global_idx / width0;
    let width1 = uniforms.output_shape[2] / ${s}u;
    let col = (index1 % width1) * ${s}u;
    index1 = index1 / width1;
    let row = index1 % uniforms.output_shape[1];
    let batch = index1 / uniforms.output_shape[1];

    let x_corner = vec2<i32>(i32(row), i32(col)) * uniforms.strides - uniforms.pads;

    var x_vals: array<${w.type.value}, ${g}>;
    var values: array<${$.type.value}, ${s}>;
    let input_channel = output_channel;
    // Use constant instead of uniform can give better performance for w's height/width.
    for (var w_height: u32 = 0u; w_height < ${p[0]}; w_height++) {
      let x_height = x_corner.x + i32(w_height);
      if (x_height >= 0 && u32(x_height) < uniforms.x_shape[1]) {
        for (var i = 0; i < ${g}; i++) {
          let x_width = x_corner.y + i;
          if (x_width >= 0 && u32(x_width) < uniforms.x_shape[2]) {
            x_vals[i] = ${w.get("batch","u32(x_height)","u32(x_width)","input_channel")};
          } else {
            x_vals[i] = ${w.type.value}(0);
          }
        }
        for (var w_width: u32 = 0u; w_width < ${p[1]}; w_width++) {
          let w_val = ${I.get("w_height","w_width","0","output_channel")};
          for (var i = 0u; i < ${s}u; i++) {
            values[i] = fma(x_vals[i * u32(uniforms.strides[1]) + w_width], w_val, values[i]);
          }
        }
      }
    }

    for (var i = 0u; i < ${s}u; i++) {
      var value = values[i];
      ${E}
      ${x}
      ${$.set("batch","row","col + i","output_channel","value")};
    }
  }`};return{name:"GroupedConv-Vectorize",shaderCache:{hint:`${t.cacheKey};${n};${s};${g};${p[0]};${p[1]}`,inputDependencies:a?["rank","rank","type"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:i?i(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:h}),getShaderSource:y}}}),zu,Cr,Cu,Ar,Sa,Li,Au,Ou,Ta,oy=P(()=>{re(),ay(),ny(),Qa(),sy(),Rt(),Ka(),gt(),zu=(e,t,r,i,a,n)=>{let s=e[0],u=e.slice(n?1:2,n?3:4),d=u.length,p=t[0],m=t.slice(2).map((g,y)=>g+(g-1)*(r[y]-1)),h=u.map((g,y)=>g+i[y]+i[y+d]).map((g,y)=>Math.floor((g-m[y]+a[y])/a[y]));return h.splice(0,0,s),h.splice(n?3:1,0,p),h},Cr=[2,3,1,0],Cu=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length>5)throw new Error("greater than 5D is not supported");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let r=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],i=e[1].dims[1]*t.group;if(r!==i)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");if(e.length===3&&(e[2].dims.length!==1||e[1].dims[0]!==e[2].dims[0]))throw new Error("invalid bias");let a=e[0].dims.length-2;if(t.dilations.length!==a)throw new Error(`dilations should be ${a}D`);if(t.strides.length!==a)throw new Error(`strides should be ${a}D`);if(t.pads.length!==a*2)throw new Error(`pads should be ${a*2}D`);if(t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape")},Ar=(e,t)=>{let r=e.kernelShape.slice();r.length<t[1].dims.length-2&&r.push(...Array(t[1].dims.length-2-r.length).fill(0));for(let n=2;n<t[1].dims.length;++n)r[n-2]===0&&(r[n-2]=t[1].dims[n]);let i=e.pads.slice();Wr.adjustPadsBasedOnAutoPad(t[0].dims,e.strides,e.dilations,r,i,e.format==="NHWC",e.autoPad);let a=Object.assign({},e);return Object.assign(a,{kernelShape:r,pads:i}),a},Sa=e=>{let t=Ha(e),r=e.format,i=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],a=e.dilations,n=e.group,s=e.kernel_shape,u=e.pads,d=e.strides,p=e.w_is_const();return{autoPad:i,format:r,dilations:a,group:n,kernelShape:s,pads:u,strides:d,wIsConst:p,...t,cacheKey:`${e.format};${t.activation};`}},Li=(e,t,r,i)=>{let a=r.format==="NHWC",n=zu(t[0].dims,t[1].dims,r.dilations,r.pads,r.strides,a);if(r.group!==1){let C=[t[0]];if(a){let A=e.kernelCustomData.wT??e.compute(Ne(t[1],Cr),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=A),C.push(A)}else C.push(t[1]);t.length===3&&C.push(t[2]),!e.adapterInfo.isArchitecture("ampere")&&a&&t[1].dims[0]===r.group&&t[1].dims[1]===1&&r.dilations[0]===1&&r.dilations[1]===1?e.compute(Vc(C,r,n,i),{inputs:C}):e.compute(Lc(C,r,n,i),{inputs:C});return}let s=t.length===3,u=t[0].dims[a?1:2],d=t[0].dims[a?2:3],p=t[0].dims[a?3:1],m=t[1].dims[2],h=t[1].dims[3],g=n[a?1:2],y=n[a?2:3],_=n[a?3:1],$=a&&m===u&&h===d&&r.pads[0]===0&&r.pads[1]===0;if($||m===1&&h===1&&r.dilations[0]===1&&r.dilations[1]===1&&r.strides[0]===1&&r.strides[1]===1&&r.pads[0]===0&&r.pads[1]===0){let C=n[0],A,v,U,q=[];if(a){let Q=e.kernelCustomData.wT??e.compute(Ne(t[1],Cr),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];if(r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=Q),$){let R=u*d*p;A=t[0].reshape([1,C,R]),v=Q.reshape([1,R,_]),U=[1,C,_]}else A=t[0].reshape([C,u*d,p]),v=Q.reshape([1,p,_]),U=[C,g*y,_];q.push(A),q.push(v)}else A=t[0].reshape([C,p,u*d]),v=t[1].reshape([1,_,p]),U=[C,_,g*y],q.push(v),q.push(A);s&&q.push(t[2]);let Y=U[2],H=q[0].dims[q[0].dims.length-1];Y<8&&H<8?e.compute(ja(q,r,n,U,a,i),{inputs:q}):e.compute(Vr(q,r,n,U,a,i),{inputs:q});return}let T=!0,x=e.kernelCustomData.wT??e.compute(Ne(t[1],Cr),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=x);let w=[t[0],x];s&&w.push(t[2]);let I=a?g*y:_,S=a?_:g*y,E=m*h*p;e.compute(Pc(w,r,n,I,S,E,s,T,i),{inputs:w})},Au=(e,t)=>{let r=t.format==="NHWC",i=[e.inputs[0].reshape(r?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&i.push(e.inputs[2]);let a=[0,t.pads[0],0,t.pads[1]],n=[1].concat(t.strides),s=[1].concat(t.dilations),u=[1].concat(t.kernelShape),d=Ar({...t,pads:a,strides:n,dilations:s,kernelShape:u},i);Li(e,i,d,p=>r?[p[0],p[2],p[3]]:[p[0],p[1],p[3]])},Ou=(e,t,r)=>{let i=r.format==="NHWC"?"channelsLast":"channelsFirst",a=Ar(r,t),n=r.autoPad==="NOTSET"?r.pads:r.autoPad,s=qc(t[0].dims,t[1].dims,r.strides,r.dilations,n,!1,i);e.compute(Wc(t,a,s.outShape,[s.filterDepth,s.filterHeight,s.filterWidth],[s.padInfo.front,s.padInfo.top,s.padInfo.left],i))},Ta=(e,t)=>{if(Cu(e.inputs,t),e.inputs[0].dims.length===3)Au(e,t);else if(e.inputs[0].dims.length===5)Ou(e,e.inputs,t);else{let r=Ar(t,e.inputs);Li(e,e.inputs,r)}}}),Gc,uy=P(()=>{J(),nt(),re(),ie(),Gc=(e,t,r)=>{let i=e.length>2,a=t.outputShape,n=t.format==="NHWC",s=t.group,u=e[1].dims,d=u[2]/s,p=u[3],m=n?$e(d):1,h=n&&p===1&&d>=4,g=h?Math.floor(d/4)*4:Math.floor(d/m)*m,y=d-g,_=n?$e(p):1,$=n?p===1?m:_:1,T=O.size(a)/_,x=[Math.ceil(T/64),1,1];le("verbose",()=>`[conv2d_backprop_webgpu] dispatch = ${x}`);let w=["rank","rank"],I=[t.strides[0],t.strides[1]],S=[t.kernelShape[n?1:2],t.kernelShape[n?2:3]],E=[t.dilations[0],t.dilations[1]],C=[S[0]+(t.dilations[0]<=1?0:(t.kernelShape[n?1:2]-1)*(t.dilations[0]-1)),S[1]+(t.dilations[1]<=1?0:(t.kernelShape[n?2:3]-1)*(t.dilations[1]-1))],A=[C[0]-1-Math.floor((t.pads[0]+t.pads[2])/2),C[1]-1-Math.floor((t.pads[1]+t.pads[3])/2)],v=[{type:12,data:T},{type:12,data:I},{type:12,data:S},{type:12,data:E},{type:12,data:C},{type:6,data:A},{type:12,data:g},{type:12,data:d},{type:12,data:p},...K(e[0].dims,e[1].dims)];i&&(v.push(...K(e[2].dims)),w.push("rank")),v.push(...K(a));let U=q=>{let Y=[{name:"output_size",type:"u32"},{name:"strides",type:"u32",length:I.length},{name:"filter_dims",type:"u32",length:S.length},{name:"dilations",type:"u32",length:S.length},{name:"effective_filter_dims",type:"u32",length:C.length},{name:"pads",type:"i32",length:A.length},{name:"input_channels_per_group_int",type:"u32"},{name:"input_channels_per_group",type:"u32"},{name:"output_channels_per_group",type:"u32"}],H=Te(e[0].dataType),Q=n?1:2,R=n?2:3,D=n?3:1,G=N("W",e[1].dataType,e[1].dims.length,$),ee=N("Dy",e[0].dataType,e[0].dims.length,m),Z=[ee,G];i&&Z.push(N("bias",e[2].dataType,[a[D]].length,_));let X=F("result",e[0].dataType,a.length,_),de=()=>{let te="";if(h)m===4?te+=`
        let xValue = ${ee.getByOffset("x_offset")};
        let wValue = ${G.getByOffset("w_offset")};
        dotProd = dotProd + dot(xValue, wValue);
        x_offset += 1u;
        w_offset += 1u;`:m===2?te+=`
          dotProd = dotProd + dot(vec4<${H}>(${ee.getByOffset("x_offset")}, ${ee.getByOffset("x_offset + 1u")}), vec4<${H}>(${G.getByOffset("w_offset")}, ${G.getByOffset("w_offset + 1u")}));
          x_offset += 2u;
          w_offset += 2u;`:m===1&&(te+=`
          dotProd = dotProd + dot(vec4<${H}>(${ee.getByOffset("x_offset")}, ${ee.getByOffset("x_offset + 1u")}, ${ee.getByOffset("x_offset + 2u")}, ${ee.getByOffset("x_offset + 3u")}), vec4<${H}>(${G.getByOffset("w_offset")}, ${G.getByOffset("w_offset + 1u")}, ${G.getByOffset("w_offset + 2u")}, ${G.getByOffset("w_offset + 3u")}));
          x_offset += 4u;
          w_offset += 4u;`);else if(te+=`
                  let xValue = ${n?ee.getByOffset(`${ee.indicesToOffset(`${ee.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${m}`):ee.get("batch","inputChannel","idyR","idyC")};
        `,m===1)te+=`
          let w_offset = ${G.indicesToOffset(`${G.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel, wOutChannel)`)};
          let wValue = ${G.getByOffset(`w_offset / ${$}`)};
          dotProd = dotProd + xValue * wValue;`;else for(let oe=0;oe<m;oe++)te+=`
            let wValue${oe} = ${G.getByOffset(`${G.indicesToOffset(`${G.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel + ${oe}, wOutChannel)`)} / ${$}`)};
            dotProd = dotProd + xValue[${oe}] * wValue${oe};`;return te},M=()=>{if(y===0)return"";if(!h)throw new Error(`packInputAs4 ${h} is not true.`);let te="";if(m===1){te+="dotProd = dotProd";for(let oe=0;oe<y;oe++)te+=`
            + ${ee.getByOffset(`x_offset + ${oe}`)} * ${G.getByOffset(`w_offset + ${oe}`)}`;te+=";"}else if(m===2){if(y!==2)throw new Error(`Invalid inputChannelsRemainder ${y}.`);te+=`
          let xValue = ${ee.getByOffset("x_offset")};
          let wValue = ${G.getByOffset("w_offset")};
          dotProd = dotProd + dot(xValue, wValue);`}return te},L=`
            let outputIndices = ${X.offsetToIndices(`global_idx * ${_}`)};
            let batch = ${X.indicesGet("outputIndices",0)};
            let d1 = ${X.indicesGet("outputIndices",D)};
            let r = ${X.indicesGet("outputIndices",Q)};
            let c = ${X.indicesGet("outputIndices",R)};
            let dyCorner = vec2<i32>(i32(r), i32(c)) - uniforms.pads;
            let dyRCorner = dyCorner.x;
            let dyCCorner = dyCorner.y;
            let groupId = d1 / uniforms.output_channels_per_group;
            let wOutChannel = d1 - groupId * uniforms.output_channels_per_group;
            // Convolve dy(?, ?, d2) with w(:, :, d1, d2) to compute dx(xR, xC, d1).
            // ? = to be determined. : = across all values in that axis.
            var dotProd = ${X.type.value}(0.0);
            var wR: u32 = 0;
            if (uniforms.dilations.x == 1) {
              // Minimum wR >= 0 that satisfies (dyRCorner + wR) % (uniforms.strides.x) == 0
              wR = u32(((dyRCorner + i32(uniforms.strides.x) - 1) / i32(uniforms.strides.x)) * i32(uniforms.strides.x) - dyRCorner);
            }
            for (; wR < uniforms.effective_filter_dims.x; wR = wR + 1) {
              if (wR % uniforms.dilations.x != 0) {
                continue;
              }
              let dyR = (${H}(dyRCorner) + ${H}(wR)) / ${H}(uniforms.strides[0]);
              let wRPerm = uniforms.filter_dims.x - 1 - wR / uniforms.dilations.x;
              if (dyR < 0.0 || dyR >= ${H}(uniforms.Dy_shape[${Q}]) || fract(dyR) > 0.0 ||
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
                let dyC = (${H}(dyCCorner) + ${H}(wC)) / ${H}(uniforms.strides.y);
                let wCPerm = uniforms.filter_dims.y - 1 - wC / uniforms.dilations.y;
                if (dyC < 0.0 || dyC >= ${H}(uniforms.Dy_shape[${R}]) ||
                    fract(dyC) > 0.0 || wCPerm < 0) {
                  continue;
                }
                let idyC: u32 = u32(dyC);
                var inputChannel = groupId * uniforms.input_channels_per_group;
                ${h?`
                var x_offset = ${ee.indicesToOffset(`${ee.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${m};
                var w_offset = ${G.indicesToOffset(`${G.type.indices}(wRPerm, wCPerm, inputChannel, wOutChannel)`)} / ${$};
                  `:""}
                for (var d2: u32 = 0; d2 < uniforms.input_channels_per_group_int; d2 = d2 + ${h?4:m}) {
                  ${de()}
                  inputChannel = inputChannel + ${h?4:m};
                }
                ${M()}
                wC = wC + uniforms.strides.y - 1;
              }
              wR = wR + uniforms.strides[0] - 1;
            }
            let value = dotProd${i?` + bias[d1 / ${_}]`:""};
            ${X.setByOffset("global_idx","value")};
          `;return`
    ${q.registerUniforms(Y).declareVariables(...Z,X)}
      ${q.mainStart()}
      ${q.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")};
    ${L}}`};return{name:"ConvTranspose2D",shaderCache:{hint:`${t.cacheKey};${m}${$}${_}${h}${y}`,inputDependencies:w},getRunData:()=>({dispatchGroup:{x:x[0],y:x[1],z:x[2]},outputs:[{dims:r?r(a):a,dataType:e[0].dataType}],programUniforms:v}),getShaderSource:U}}}),Ru,Bu,Nu,Vi,Hc,Mu,Gi,Du,Fc,ly=P(()=>{uy(),Rt(),gt(),Ru=(e,t,r,i,a,n)=>(e-1)*t+r+(i-1)*a+1-n,Bu=(e,t,r,i,a)=>{let n=Math.floor(e/2);t==="SAME_UPPER"?(r[i]=n,r[a]=e-n):t==="SAME_LOWER"&&(r[i]=e-n,r[a]=n)},Nu=(e,t,r,i,a,n,s,u,d,p)=>{let m=e.length-2,h=p.length===0;d.length<m&&d.push(...Array(m-d.length).fill(0));let g=e[0],y=t[u?3:1]*a;for(let _=0,$=e.length-m-(u?1:0);_<m;++_,++$){let T=e[$],x=h?T*s[_]:p[_],w=Ru(T,s[_],n[_],t[$],r[_],x);Bu(w,i,n,_,_+m),h&&p.push(s[_]*(T-1)+d[_]+(t[$]-1)*r[_]+1-n[_]-n[_+m])}p.splice(0,0,g),p.splice(u?3:1,0,y)},Vi=(e,t)=>{let r=e.kernelShape.slice();if(e.kernelShape.length===0||e.kernelShape.reduce((h,g)=>h*g,1)===0){r.length=0;for(let h=2;h<t[1].dims.length;++h)r.push(t[1].dims[h])}let i=e.format==="NHWC";r.splice(0,0,t[1].dims[0]),r.splice(i?3:1,0,t[1].dims[1]);let a=e.pads.slice(),n=e.outputShape.slice(),s=e.outputPadding.slice(),u=t[0].dims,d=e.dilations.slice();if(d.reduce((h,g)=>h+g,0)===0){let h=t[0].dims.length-2;d=new Array(h).fill(1)}let p=e.strides.slice();if(p.reduce((h,g)=>h+g,0)===0){let h=t[0].dims.length-2;p=new Array(h).fill(1)}Nu(u,r,d,e.autoPad,e.group,a,p,i,s,n);let m=Object.assign({},e);return Object.assign(m,{kernelShape:r,pads:a,outputPadding:s,outputShape:n,dilations:d,strides:p}),m},Hc=e=>{let t=Ha(e),r=e.format,i=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][typeof e.autoPad>"u"?0:e.autoPad],a=e.dilations,n=e.group,s=e.kernelShape,u=e.pads,d=e.strides,p=e.wIsConst(),m=e.outputPadding,h=e.outputShape;return{autoPad:i,format:r,dilations:a,group:n,kernelShape:s,outputPadding:m,outputShape:h,pads:u,strides:d,wIsConst:p,...t,cacheKey:`${e.format};${t.activation};`}},Mu=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length!==4&&e[0].dims.length!==3)throw new Error("currently only support 2-dimensional conv");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let r=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],i=e[1].dims[0];if(r!==i)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");let a=e[1].dims[1]*t.group;if(e.length===3&&(e[2].dims.length!==1||e[2].dims[0]!==a))throw new Error("invalid bias");let n=e[0].dims.length-2;if(t.dilations.reduce((s,u)=>s+u,0)>0&&t.dilations.length!==n)throw new Error(`dilations should be ${n}D`);if(t.strides.reduce((s,u)=>s+u,0)>0&&t.strides.length!==n)throw new Error(`strides should be ${n}D`);if(t.pads.reduce((s,u)=>s+u,0)>0&&t.pads.length!==n*2)throw new Error(`pads should be ${n*2}D`);if(t.outputPadding.length!==n&&t.outputPadding.length!==0)throw new Error(`output_padding should be ${n}D`);if(t.kernelShape.reduce((s,u)=>s+u,0)>0&&t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape");if(t.outputShape.length!==0&&t.outputShape.length!==e[0].dims.length-2)throw new Error("invalid output shape")},Gi=(e,t,r,i)=>{let a=e.kernelCustomData.wT??e.compute(Ne(t[1],[2,3,0,1]),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=a);let n=[t[0],a];t.length===3&&n.push(t[2]),e.compute(Gc(n,r,i),{inputs:n})},Du=(e,t)=>{let r=t.format==="NHWC",i=[e.inputs[0].reshape(r?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&i.push(e.inputs[2]);let a=t.kernelShape;(a.length===0||a[0]===0)&&(a=[e.inputs[1].dims[2]]);let n=t.dilations;(n.length===0||n[0]===0)&&(n=[1]);let s=t.strides;(s.length===0||s[0]===0)&&(s=[1]);let u=t.pads;u.length===0&&(u=[0,0]),u=[0,u[0],0,u[1]],s=[1].concat(s),n=[1].concat(n),a=[1].concat(a);let d=t.outputPadding;d=[0].concat(d);let p=Vi({...t,pads:u,strides:s,dilations:n,kernelShape:a,outputPadding:d},i);Gi(e,i,p,m=>r?[m[0],m[2],m[3]]:[m[0],m[1],m[3]])},Fc=(e,t)=>{if(Mu(e.inputs,t),e.inputs[0].dims.length===3)Du(e,t);else{let r=Vi(t,e.inputs);Gi(e,e.inputs,r)}}}),Uu,jc,Kc,dy=P(()=>{J(),re(),ve(),ie(),Uu=(e,t,r,i)=>{let a=O.size(t),n=t.length,s=N("input",e,n),u=F("output",e,n),d=r.dataType===6?r.getInt32Array()[0]:Number(r.getBigInt64Array()[0]),p=O.normalizeAxis(d,n),m=h=>{let g=` i32(${s.indicesGet("inputIndices","uniforms.axis")}) `,y=j("uniforms.input_shape","uniforms.axis",n),_=i.reverse?g+(i.exclusive?" + 1":""):"0",$=i.reverse?y:g+(i.exclusive?"":" + 1");return`
                ${h.registerUniform("outputSize","u32").registerUniform("axis","u32").declareVariables(s,u)}
                ${h.mainStart()}
                  ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
                  var inputIndices = ${u.offsetToIndices("global_idx")};
                  var sum = ${u.type.value}(0);
                  let first : i32 = ${_};
                  let last : i32 = ${$};
                  for (var i : i32 = first; i < last; i++) {
                    ${s.indicesSet("inputIndices","uniforms.axis","u32(i)")};
                    sum = sum + ${s.getByIndices("inputIndices")};
                  }
                  ${u.setByOffset("global_idx","sum")};
                }`};return{name:"CumSum",shaderCache:{hint:i.cacheKey,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:t,dataType:e}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:[{type:12,data:a},{type:12,data:p},...K(t,t)]}),getShaderSource:m}},jc=(e,t)=>{let r=e.inputs[0].dims,i=e.inputs[0].dataType,a=e.inputs[1];e.compute(Uu(i,r,a,t),{inputs:[0]})},Kc=e=>{let t=e.exclusive===1,r=e.reverse===1;return he({exclusive:t,reverse:r})}}),Pu,qu,Wu,Qc,Zc,py=P(()=>{J(),re(),ve(),ie(),Pu=e=>{if(!e||e.length!==1)throw new Error("DepthToSpace requires 1 input.");if(e[0].dims.length!==4)throw new Error("DepthToSpace requires 4D input.")},qu=(e,t,r,i)=>{let a=[];a.push(`fn perm(i: ${i.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`);for(let n=0;n<t;++n)a.push(r.indicesSet("a",e[n],`i[${n}]`));return a.push("return a;}"),a.join(`
`)},Wu=(e,t)=>{let r,i,a,n,s,u,d=t.format==="NHWC",p=t.blocksize,m=t.mode==="DCR";d?([r,i,a,n]=e.dims,s=m?[r,i,a,p,p,n/p**2]:[r,i,a,n/p**2,p,p],u=m?[0,1,3,2,4,5]:[0,1,4,2,5,3]):([r,i,a,n]=[e.dims[0],e.dims[2],e.dims[3],e.dims[1]],s=m?[r,p,p,n/p**2,i,a]:[r,n/p**2,p,p,i,a],u=m?[0,3,4,1,5,2]:[0,1,4,2,5,3]);let h=e.reshape(s),g=h.dims.length,y=e.dataType,_=N("a",y,g),$=F("output",y,g),T=x=>`
  ${x.registerUniform("output_size","u32").declareVariables(_,$)}

  ${qu(u,g,_,$)}

  ${x.mainStart()}
    ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${$.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${$.setByOffset("global_idx",_.getByIndices("aIndices"))}
  }`;return{name:"DepthToSpace",shaderCache:{hint:`${e.dims};${t.blocksize};${t.mode}`,inputDependencies:["rank"]},getRunData:x=>{let w=d?[r,i*p,a*p,n/p**2]:[r,n/p**2,i*p,a*p],I=O.size(w),S=h.dims,E=O.sortBasedOnPerm(S,u);return{outputs:[{dims:w,dataType:x[0].dataType}],dispatchGroup:{x:Math.ceil(I/64)},programUniforms:[{type:12,data:I},...K(S,E)]}},getShaderSource:T}},Qc=(e,t)=>{Pu(e.inputs),e.compute(Wu(e.inputs[0],t))},Zc=e=>he({blocksize:e.blocksize,mode:e.mode,format:e.format})}),Or,Xt,Hi,Lu,Vu,Gu,Hu,Fi,Fu,Yc,Xc,cy=P(()=>{J(),re(),ve(),ie(),Or="[a-zA-Z]|\\.\\.\\.",Xt="("+Or+")+",Hi="^"+Xt+"$",Lu="("+Xt+",)*"+Xt,Vu="^"+Lu+"$",Gu=class{constructor(e=-1){this.symbolToIndices=new Map,this.inputIndex=e}addSymbol(e,t){let r=this.symbolToIndices.get(e);r===void 0?r=[t]:r.push(t),this.symbolToIndices.set(e,r)}},Hu=class{constructor(e,t){this.equation=t,this.hasEllipsis=!1,this.symbolToInfo=new Map,this.lhs=new Array,this.outputDims=[];let[r,i]=t.includes("->")?t.split("->",2):[t,""];if(!r.match(RegExp(Vu)))throw new Error("Invalid LHS term");if(r.split(",").forEach((a,n)=>{let s=e[n].dims.slice();if(!a.match(RegExp(Hi)))throw new Error("Invalid LHS term");let u=this.processTerm(a,!0,s,n);this.lhs.push(u)}),i==="")i+=[...this.symbolToInfo.entries()].filter(([a,n])=>n.count===1||a==="...").map(([a])=>a).join("");else if(!i.match(RegExp(Xt)))throw new Error("Invalid RHS");i.match(RegExp(Or,"g"))?.forEach(a=>{if(a==="...")this.outputDims=this.outputDims.concat(this.ellipsisDims);else{let n=this.symbolToInfo.get(a);if(n===void 0)throw new Error("Invalid RHS symbol");this.outputDims.push(n.dimValue)}}),this.rhs=this.processTerm(i,!1,this.outputDims)}addSymbol(e,t,r){let i=this.symbolToInfo.get(e);if(i!==void 0){if(i.dimValue!==t&&i.count!==1)throw new Error("Dimension mismatch");i.count++,i.inputIndices.push(r)}else i={count:1,dimValue:t,inputIndices:[r]};this.symbolToInfo.set(e,i)}processTerm(e,t,r,i=-1){let a=r.length,n=!1,s=[],u=0;if(!e.match(RegExp(Hi))&&!t&&e!=="")throw new Error("Invalid LHS term");let d=e.match(RegExp(Or,"g")),p=new Gu(i);return d?.forEach((m,h)=>{if(m==="..."){if(n)throw new Error("Only one ellipsis is allowed per input term");n=!0;let g=a-d.length+1;if(g<0)throw new Error("Ellipsis out of bounds");if(s=r.slice(u,u+g),this.hasEllipsis){if(this.ellipsisDims.length!==s.length||this.ellipsisDims.toString()!==s.toString())throw new Error("Ellipsis dimensions mismatch")}else if(t)this.hasEllipsis=!0,this.ellipsisDims=s;else throw new Error("Ellipsis must be specified in the LHS");for(let y=0;y<s.length;y++){let _=String.fromCharCode(48+y);p.addSymbol(_,h+y),this.addSymbol(_,r[u++],i)}}else p.addSymbol(m,h+(this.hasEllipsis?this.ellipsisDims.length-1:0)),this.addSymbol(m,r[u++],i)}),p}},Fi=e=>e+"_max",Fu=(e,t,r,i)=>{let a=e.map(p=>p.length).map((p,m)=>N(`input${m}`,t,p)),n=O.size(i),s=F("output",t,i.length),u=[...r.symbolToInfo.keys()].filter(p=>!r.rhs.symbolToIndices.has(p)),d=p=>{let m=[],h="var prod = 1.0;",g="var sum = 0.0;",y="sum += prod;",_=[],$=[],T=[],x=[],w=r.symbolToInfo.size===r.rhs.symbolToIndices.size;r.symbolToInfo.forEach((S,E)=>{if(r.rhs.symbolToIndices.has(E)){let C=r.rhs.symbolToIndices.get(E)?.[0];C!==void 0&&r.lhs.forEach((A,v)=>{if(S.inputIndices.includes(v)){let U=A.symbolToIndices.get(E);if(U===void 0)throw new Error("Invalid symbol error");U.forEach(q=>{m.push(`${a[v].indicesSet(`input${v}Indices`,q,s.indicesGet("outputIndices",C))}`)})}})}else r.lhs.forEach((C,A)=>{if(S.inputIndices.includes(A)){let v=C.symbolToIndices.get(E);if(v===void 0)throw new Error("Invalid symbol error");v.forEach(U=>{_.push(`${a[A].indicesSet(`input${A}Indices`,U,`${E}`)}`)}),x.push(`prod *= ${a[A].getByIndices(`input${A}Indices`)};`)}}),$.push(`for(var ${E}: u32 = 0; ${E} < uniforms.${Fi(E)}; ${E}++) {`),T.push("}")});let I=w?[...m,`let sum = ${a.map((S,E)=>S.getByIndices(`input${E}Indices`)).join(" * ")};`]:[...m,g,...$,..._,h,...x,y,...T];return`
            ${p.registerUniforms(u.map(S=>({name:`${Fi(S)}`,type:"u32"}))).registerUniform("outputSize","u32").declareVariables(...a,s)}

            ${p.mainStart()}
            ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
            var outputIndices = ${s.offsetToIndices("global_idx")};
            ${a.map((S,E)=>`var input${E}Indices: ${a[E].type.indices};`).join(`
`)}
            ${I.join(`
`)};
            ${s.setByOffset("global_idx","sum")};
          }`};return{name:"Einsum",shaderCache:{hint:r.equation,inputDependencies:e.map(()=>"rank")},getRunData:()=>{let p=u.filter(h=>r.symbolToInfo.has(h)).map(h=>({type:12,data:r.symbolToInfo.get(h)?.dimValue||0}));p.push({type:12,data:n});let m=e.map((h,g)=>[...K(h)]).reduce((h,g)=>h.concat(g),p);return m.push(...K(i)),{outputs:[{dims:i,dataType:t}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:m}},getShaderSource:d}},Yc=(e,t)=>{let r=new Hu(e.inputs,t.equation),i=r.outputDims,a=e.inputs.map((n,s)=>n.dims);e.compute(Fu(a,e.inputs[0].dataType,r,i))},Xc=e=>{let t=e.equation.replace(/\s+/g,"");return he({equation:t})}}),ju,ji,Ku,Qu,Jc,hy=P(()=>{J(),re(),ie(),ju=e=>{if(!e||e.length!==2)throw new Error("Expand requires 2 input.");let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),i=r.length<t.length?0:r.length-t.length,a=t.length<r.length?0:t.length-r.length;for(;i<r.length&&a<t.length;++i,++a)if(r[i]!==t[a]&&r[i]!==1&&t[a]!==1)throw new Error("Expand requires shape to be broadcastable to input")},ji=(e,t)=>{let r=e.length-t.length,i=[];for(let a=0;a<r;++a)i.push(e[a]);for(let a=0;a<t.length;++a)i.push(t[a]===1?e[a+r]:t[a]);return i},Ku=(e,t)=>e.length>t.length?ji(e,t):ji(t,e),Qu=e=>{let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),i=Ku(t,r),a=e[0].dataType,n=a===9||O.size(t)===1,s=a===9||t.length>0&&t[t.length-1]%4===0?4:1,u=n||i.length>0&&i[i.length-1]%4===0?4:1,d=Math.ceil(O.size(i)/u),p=h=>{let g=N("input",a,t.length,s),y=F("output",a,i.length,u),_;if(a===9){let $=(T,x,w="")=>`
          let outputIndices${x} = ${y.offsetToIndices(`outputOffset + ${x}u`)};
          let offset${x} = ${g.broadcastedIndicesToOffset(`outputIndices${x}`,y)};
          let index${x} = offset${x} / 4u;
          let component${x} = offset${x} % 4u;
          ${T}[${x}] = ${w}(${g.getByOffset(`index${x}`)}[component${x}]);
        `;_=`
        let outputOffset = global_idx * ${u};
        var data = vec4<u32>(0);
        ${$("data",0,"u32")}
        ${$("data",1,"u32")}
        ${$("data",2,"u32")}
        ${$("data",3,"u32")}
        ${y.setByOffset("global_idx","data")}
      }`}else _=`
        let outputIndices = ${y.offsetToIndices(`global_idx * ${u}`)};
        let inputOffset = ${g.broadcastedIndicesToOffset("outputIndices",y)};
        let data = ${y.type.value}(${g.getByOffset(`inputOffset / ${s}`)});
        ${y.setByOffset("global_idx","data")}
      }`;return`
    ${h.registerUniform("vec_size","u32").declareVariables(g,y)}
    ${h.mainStart()}
    ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
    ${_}`},m=[{type:12,data:d},...K(t,i)];return{name:"Expand",shaderCache:{hint:`${i.length};${s}${u}`,inputDependencies:["rank"]},getShaderSource:p,getRunData:()=>({outputs:[{dims:i,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:m})}},Jc=e=>{ju(e.inputs),e.compute(Qu(e.inputs),{inputs:[0]})}}),Zu,eh,fy=P(()=>{J(),re(),ie(),Ga(),Zu=e=>{let t=e[0].dataType,r=O.size(e[0].dims),i=O.size(e[1].dims),a=i%4===0,n=s=>{let u=N("x",t,[1],4),d=N("bias",t,[1],4),p=F("y",t,[1],4),m=[{name:"output_vec_size",type:"u32"},{name:"bias_size",type:"u32"}],h=y=>`
      let bias${y}_offset: u32 = (global_idx * 4 + ${y}) % uniforms.bias_size;
      let bias${y} = ${d.getByOffset(`bias${y}_offset / 4`)}[bias${y}_offset % 4];`,g=a?`
      let bias = ${d.getByOffset("global_idx % (uniforms.bias_size / 4)")};`:`${h(0)}${h(1)}${h(2)}${h(3)}
      let bias = ${u.type.value}(bias0, bias1, bias2, bias3);`;return`${s.registerUniforms(m).declareVariables(u,d,p)}

    ${ba(Ee(t))}

    ${s.mainStart(qt)}
      ${s.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_vec_size")}

      let x = ${u.getByOffset("global_idx")};
      ${g}
      let x_in = x + bias;
      ${p.setByOffset("global_idx",$a("x_in"))}
    }`};return{name:"FastGeluWithBias",shaderCache:{hint:`${a}`,inputDependencies:["type","type"]},getShaderSource:n,getRunData:s=>({outputs:[{dims:s[0].dims,dataType:s[0].dataType}],programUniforms:[{type:12,data:Math.ceil(r/4)},{type:12,data:i}],dispatchGroup:{x:Math.ceil(r/qt/4)}})}},eh=e=>{e.inputs.length<2||O.size(e.inputs[1].dims)===0?bc(e):e.compute(Zu(e.inputs))}}),Yu,Xu,th,rh,my=P(()=>{J(),re(),ve(),ie(),Yu=e=>{if(!e||e.length!==2)throw new Error("Gather requires 2 inputs.")},Xu=(e,t)=>{let r=e[0].dims,i=e[1].dims,a=r.length,n=O.normalizeAxis(t.axis,a),s=r.slice(0);s.splice(n,1,...i);let u=r[n],d=e[0].dataType===9?4:1,p=Math.ceil(O.size(s)/d),m=[{type:12,data:p},{type:6,data:u},{type:12,data:n},...K(e[0].dims,e[1].dims,s)],h=g=>{let y=N("data",e[0].dataType,e[0].dims.length,d),_=N("inputIndices",e[1].dataType,e[1].dims.length),$=F("output",e[0].dataType,s.length,d),T=w=>{let I=i.length,S=`var indicesIndices${w}  = ${_.type.indices}(0);`;for(let E=0;E<I;E++)S+=`${I>1?`indicesIndices${w}[${E}]`:`indicesIndices${w}`} = ${s.length>1?`outputIndices${w}[uniforms.axis + ${E}]`:`outputIndices${w}`};`;S+=`
          var idx${w} = ${_.getByIndices(`indicesIndices${w}`)};
          if (idx${w} < 0) {
            idx${w} = idx${w} + uniforms.axisDimLimit;
          }
          var dataIndices${w} : ${y.type.indices};
        `;for(let E=0,C=0;E<a;E++)E===n?(S+=`${a>1?`dataIndices${w}[${E}]`:`dataIndices${w}`} = u32(idx${w});`,C+=I):(S+=`${a>1?`dataIndices${w}[${E}]`:`dataIndices${w}`} = ${s.length>1?`outputIndices${w}[${C}]`:`outputIndices${w}`};`,C++);return S},x;if(e[0].dataType===9){let w=(I,S,E="")=>`
          let outputIndices${S} = ${$.offsetToIndices(`outputOffset + ${S}u`)};
          ${T(S)};
          let offset${S} = ${y.indicesToOffset(`dataIndices${S}`)};
          let index${S} = offset${S} / 4u;
          let component${S} = offset${S} % 4u;
          ${I}[${S}] = ${E}(${y.getByOffset(`index${S}`)}[component${S}]);
        `;x=`
        let outputOffset = global_idx * ${d};
        var value = vec4<u32>(0);
        ${w("value",0,"u32")}
        ${w("value",1,"u32")}
        ${w("value",2,"u32")}
        ${w("value",3,"u32")}
        ${$.setByOffset("global_idx","value")}
      `}else x=`
      let outputIndices = ${$.offsetToIndices("global_idx")};
      ${T("")};
      let value = ${y.getByIndices("dataIndices")};
      ${$.setByOffset("global_idx","value")};
      `;return`
      ${g.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(y,_,$)}
      ${g.mainStart()}
        ${g.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        ${x}
      }`};return{name:"Gather",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:s,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:m}),getShaderSource:h}},th=e=>he({axis:e.axis}),rh=(e,t)=>{let r=e.inputs;Yu(r),e.compute(Xu(e.inputs,t))}}),Ju,ih,ah,gy=P(()=>{J(),re(),ie(),Ju=(e,t,r,i,a,n,s,u,d)=>{let p=[{type:12,data:n},{type:12,data:i},{type:12,data:a},{type:12,data:r},{type:12,data:s},{type:12,data:u},{type:12,data:d}],m=[n];p.push(...K(t.dims,m));let h=g=>{let y=N("indices_data",t.dataType,t.dims.length),_=F("input_slice_offsets_data",12,1,1),$=[y,_],T=[{name:"output_size",type:"u32"},{name:"batch_dims",type:"u32"},{name:"input_dims",type:"u32",length:a.length},{name:"sizes_from_slice_dims_data",type:"u32",length:r.length},{name:"num_slices_per_batch",type:"u32"},{name:"input_batch_stride",type:"u32"},{name:"num_slice_dims",type:"u32"}];return`
  ${g.registerUniforms(T).declareVariables(...$)}
  ${g.mainStart()}
    ${g.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
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
      ${r.length===1?"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data);":"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data[dim_idx]);"}
    }

    input_slice_offsets_data[global_idx] =  base_offset + u32(relative_slice_offset);
  }`};return e.compute({name:"computeSliceOffsets",shaderCache:{hint:`${a.length}_${r.length}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:m,dataType:e.inputs[1].dataType}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:p}),getShaderSource:h},{inputs:[t],outputs:[-1]})[0]},ih=(e,t)=>{let r=e.inputs,i=r[0].dims,a=r[0].dataType,n=r[1].dims,s=n[n.length-1],u=O.sizeToDimension(n,n.length-1),d=O.sizeFromDimension(i,t.batchDims+s),p=O.sizeToDimension(i,t.batchDims),m=O.sizeFromDimension(i,t.batchDims),h=u/p,g=new Array(s),y=d;for(let S=0;S<s;++S)g[s-1-S]=y,y*=i[t.batchDims+s-1-S];let _=Ju(e,r[1],g,t.batchDims,i,u,h,m,s),$=t.batchDims+s;if($>i.length)throw new Error("last dimension of indices must not be larger than rank of input tensor");let T=n.slice(0,-1).concat(i.slice($)),x=O.size(T),w=[{type:12,data:x},{type:12,data:d},...K(r[0].dims,_.dims,T)],I=S=>{let E=N("data",r[0].dataType,r[0].dims.length),C=N("slice_offsets",12,_.dims.length),A=F("output",r[0].dataType,T.length);return`
          ${S.registerUniform("output_size","u32").registerUniform("slice_size","u32").declareVariables(E,C,A)}
            ${S.mainStart()}
            ${S.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let slice_offset = slice_offsets[global_idx / uniforms.slice_size];
          output[global_idx] = data[u32(slice_offset) + global_idx % uniforms.slice_size];
        }`};e.compute({name:"GatherND",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:T,dataType:a}],dispatchGroup:{x:Math.ceil(x/64)},programUniforms:w}),getShaderSource:I},{inputs:[r[0],_]})},ah=e=>({batchDims:e.batch_dims,cacheKey:""})}),el,tl,nh,sh,yy=P(()=>{J(),re(),ve(),ie(),el=(e,t)=>{if(e.length<3||e.length>4)throw new Error("GatherBlockQuantized requires 3 or 4 inputs.");let r=O.normalizeAxis(t.quantizeAxis,e[0].dims.length),i=t.blockSize,a=e[0],n=e[2],s=e.length===4?e[3]:void 0;if(n.dims.length!==a.dims.length||!a.dims.map((u,d)=>d===r?Math.ceil(u/i)===n.dims[d]:u===n.dims[d]).reduce((u,d)=>u&&d,!0))throw new Error("Scales must have the same rank as the input tensor and the dims should match except on gatherAxis.");if(s){if(s.dataType!==a.dataType)throw new Error("Zero point must have the same data type as the input tensor.");if(s.dims.length!==n.dims.length||!s.dims.map((u,d)=>u===n.dims[d]).reduce((u,d)=>u&&d,!0))throw new Error("Zero point must have the same rank as the input tensor and the dims should match except on quantizeAxis.")}},tl=(e,t)=>{let r=e[0].dims,i=e[1].dims,a=r.length,n=O.normalizeAxis(t.gatherAxis,a),s=O.normalizeAxis(t.quantizeAxis,a),u=r.slice(0);u.splice(n,1,...i);let d=O.size(u),p=e[2].dataType,m=e[0].dataType===22,h=[{type:12,data:d},{type:12,data:s},{type:12,data:n},{type:12,data:t.blockSize},...K(...e.map((y,_)=>y.dims),u)],g=y=>{let _=N("data",e[0].dataType,e[0].dims.length),$=N("inputIndices",e[1].dataType,e[1].dims.length),T=N("scales",e[2].dataType,e[2].dims.length),x=e.length>3?N("zeroPoint",e[3].dataType,e[3].dims.length):void 0,w=F("output",p,u.length),I=[_,$,T];x&&I.push(x);let S=[{name:"output_size",type:"u32"},{name:"quantize_axis",type:"u32"},{name:"gather_axis",type:"u32"},{name:"block_size",type:"u32"}];return`
        ${y.registerUniforms(S).declareVariables(...I,w)}
        ${y.mainStart()}
        let output_indices = ${w.offsetToIndices("global_idx")};
        var indices_indices = ${$.type.indices}(0);
        ${i.length>1?`
          for (var i: u32 = 0; i < ${i.length}; i++) {
            let index = ${w.indicesGet("output_indices","uniforms.gather_axis + i")};
            ${$.indicesSet("indices_indices","i","index")};
          }`:`indices_indices = ${w.indicesGet("output_indices","uniforms.gather_axis")};`};
        var data_indices = ${_.type.indices}(0);
        for (var i: u32 = 0; i < uniforms.gather_axis; i++) {
          let index = ${w.indicesGet("output_indices","i")};
          ${_.indicesSet("data_indices","i","index")};
        }
        var index_from_indices = ${$.getByIndices("indices_indices")};
        if (index_from_indices < 0) {
          index_from_indices += ${r[n]};
        }
        ${_.indicesSet("data_indices","uniforms.gather_axis","u32(index_from_indices)")};
        for (var i = uniforms.gather_axis + 1; i < ${u.length}; i++) {
          let index = ${w.indicesGet("output_indices",`i + ${i.length} - 1`)};
          ${_.indicesSet("data_indices","i","index")};
        }
        let data_offset = ${_.indicesToOffset("data_indices")};
        let data_index = data_offset % 8;
        // Convert 4-bit packed data to 8-bit packed data.
        let packed_4bit_quantized_data = ${_.getByOffset("data_offset / 8")};
        let packed_8bit_quantized_data = (packed_4bit_quantized_data >> (4 * (data_index % 2))) & 0x0f0f0f0f;
        let quantized_data_vec = ${m?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_quantized_data));
        let quantized_data = quantized_data_vec[data_index / 2];
        var scale_indices = data_indices;
        let quantize_axis_index = ${T.indicesGet("data_indices","uniforms.quantize_axis")} / uniforms.block_size;
        ${T.indicesSet("scale_indices","uniforms.quantize_axis","quantize_axis_index")};
        var scale = ${T.getByIndices("scale_indices")};
        ${x?`
              let zero_point_indices = scale_indices;
              let zero_point_offset = ${x.indicesToOffset("zero_point_indices")};
              let zero_point_index = zero_point_offset % 8;
              let packed_4bit_zero_points = ${x.getByOffset("zero_point_offset / 8")};
              let packed_8bit_zero_points = (packed_4bit_zero_points >> (4 * (zero_point_index % 2))) & 0x0f0f0f0f;
              let zero_point_vec = ${m?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_zero_points));
              let zero_point = zero_point_vec[zero_point_index / 2];`:"var zero_point = 0"};
        let dequantized_data = ${Ee(p)}(quantized_data - zero_point) * scale;
        ${w.setByOffset("global_idx","dequantized_data")};
    }`};return{name:"GatherBlockQuantized",shaderCache:{hint:`${t.cacheKey};${e.filter((y,_)=>_!==1).map(y=>y.dims.join("_")).join(";")}`,inputDependencies:Array.from({length:e.length},(y,_)=>"rank")},getRunData:()=>({outputs:[{dims:u,dataType:p}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:h}),getShaderSource:g}},nh=(e,t)=>{let r=e.inputs;el(r,t),e.compute(tl(e.inputs,t))},sh=e=>he({blockSize:e.blockSize,gatherAxis:e.gatherAxis,quantizeAxis:e.quantizeAxis})}),rl,il,oh,uh,_y=P(()=>{J(),re(),ve(),ie(),rl=e=>{if(!e||e.length!==2)throw new Error("GatherElements requires 2 inputs.");if(e[0].dims.length<1)throw new Error("GatherElements requires that the data input be rank >= 1.");if(e[0].dims.length!==e[1].dims.length)throw new Error(`GatherElements requires that the data input and
                     indices input tensors be of same rank.`)},il=(e,t)=>{let r=e[0].dims,i=e[0].dataType,a=r.length,n=e[1].dims,s=e[1].dataType,u=O.normalizeAxis(t.axis,a),d=r[u],p=n.slice(0),m=O.size(p),h=N("input",i,a),g=N("indicesInput",s,n.length),y=F("output",i,p.length),_=[{type:12,data:m},{type:6,data:d},{type:12,data:u}];return _.push(...K(r,n,p)),{name:"GatherElements",shaderCache:{inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:p,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:_}),getShaderSource:$=>`
      ${$.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(h,g,y)}
      ${$.mainStart()}
      ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

      let outputIndices = ${y.offsetToIndices("global_idx")};

      var idx = ${g.getByOffset("global_idx")};
      if (idx < 0) {
        idx = idx + uniforms.axisDimLimit;
      }
      var inputIndices = ${h.type.indices}(outputIndices);
      ${h.indicesSet("inputIndices","uniforms.axis","u32(idx)")};
      let value = ${h.getByIndices("inputIndices")};

      ${y.setByOffset("global_idx","value")};
  }`}},oh=e=>he({axis:e.axis}),uh=(e,t)=>{let r=e.inputs;rl(r),e.compute(il(e.inputs,t))}}),al,nl,lh,dh,wy=P(()=>{J(),re(),ie(),al=e=>{if(!e)throw new Error("Input is missing");if(e.length<2||e.length>3)throw new Error("Invaid input number.");if(e.length===3&&e[2].dims.length>2)throw new Error("Invalid input shape of C");if(e[0].dataType!==e[1].dataType||e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("Input types are mismatched")},nl=(e,t)=>{let r=e[0].dims.slice(),i=e[1].dims.slice(),[a,n,s]=op.getShapeOfGemmResult(r,t.transA,i,t.transB,e.length===3?e[2].dims:void 0),u=[a,n];if(!u)throw new Error("Can't use gemm on the given tensors");let d=16,p=Math.ceil(n/d),m=Math.ceil(a/d),h=!0,g=O.size(u),y=[{type:12,data:h?p:g},{type:12,data:a},{type:12,data:n},{type:12,data:s},{type:1,data:t.alpha},{type:1,data:t.beta}],_=["type","type"];e.length===3&&(y.push(...K(e[2].dims)),_.push("rank")),y.push(...K(u));let $=x=>{let w="";t.transA&&t.transB?w="value += a[k * uniforms.M + m] * b[n * uniforms.K + k];":t.transA&&!t.transB?w="value += a[k * uniforms.M + m] * b[k * uniforms.N + n];":!t.transA&&t.transB?w="value += a[m * uniforms.K + k] * b[n * uniforms.K + k];":!t.transA&&!t.transB&&(w="value += a[m * uniforms.K + k] * b[k * uniforms.N + n];");let I=t.alpha===1?"":"value *= uniforms.alpha;",S=N("a",e[0].dataType,e[0].dims),E=N("b",e[1].dataType,e[1].dims),C=S.type.value,A=null,v=[S,E];e.length===3&&(A=N("c",e[2].dataType,e[2].dims.length),v.push(A));let U=F("output",e[0].dataType,u.length);v.push(U);let q=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}];return`
  ${x.registerUniforms(q).declareVariables(...v)}

  ${x.mainStart()}
    ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let m = global_idx / uniforms.N;
    let n = global_idx % uniforms.N;

    var value = ${C}(0);
    for (var k: u32 = 0u; k < uniforms.K; k++) {
      ${w}
    }

    ${I}
    ${A!=null?`let cOffset = ${A.broadcastedIndicesToOffset("vec2(m, n)",U)}; value += ${C}(uniforms.beta) * ${A.getByOffset("cOffset")};`:""}
    output[global_idx] = value;
  }`},T=x=>{let w=N("a",e[0].dataType,e[0].dims),I=N("b",e[1].dataType,e[1].dims),S=null,E=[w,I];e.length===3&&(S=N("c",e[2].dataType,e[2].dims.length),E.push(S));let C=F("output",e[0].dataType,u.length);E.push(C);let A=[{name:"num_tile_n",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}],v="",U="";t.transA&&t.transB?(U=`
      var col = tile_row_start + local_id.x;
      var row = k_start + local_id.y;
      if (col < uniforms.M && row < uniforms.K) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${w.type.value}(0);
      }

      col = k_start + local_id.x;
      row = tile_col_start + local_id.y;
      if (col < uniforms.K && row < uniforms.N) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.K + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${I.type.value}(0);
      }
      `,v="value += tile_a[k][local_id.y] * tile_b[local_id.x][k];"):t.transA&&!t.transB?(U=`
      var col = tile_row_start + local_id.x;
      var row = k_start + local_id.y;
      if (col < uniforms.M && row < uniforms.K) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${w.type.value}(0);
      }

      col = tile_col_start + local_id.x;
      row = k_start + local_id.y;
      if (col < uniforms.N && row < uniforms.K) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.N + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${I.type.value}(0);
      }
      `,v="value += tile_a[k][local_id.y] * tile_b[k][local_id.x];"):!t.transA&&t.transB?(U=`
      var col = k_start + local_id.x;
      var row = tile_row_start + local_id.y;
      if (col < uniforms.K && row < uniforms.M) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.K + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${w.type.value}(0);
      }

      col = k_start + local_id.x;
      row = tile_col_start + local_id.y;
      if (col < uniforms.K && row < uniforms.N) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.K + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${I.type.value}(0);
      }
      `,v="value += tile_a[local_id.y][k] * tile_b[local_id.x][k];"):!t.transA&&!t.transB&&(U=`
      var col = k_start + local_id.x;
      var row = tile_row_start + local_id.y;
      if (col < uniforms.K && row < uniforms.M) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.K + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${w.type.value}(0);
      }

      col = tile_col_start + local_id.x;
      row = k_start + local_id.y;
      if (col < uniforms.N && row < uniforms.K) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.N + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${I.type.value}(0);
      }
      `,v="value += tile_a[local_id.y][k] * tile_b[k][local_id.x];");let q=t.alpha===1?"":"value *= uniforms.alpha;";return`
  ${x.registerUniforms(A).declareVariables(...E)}
  var<workgroup> tile_a: array<array<${w.type.storage}, ${d}>, ${d}>;
  var<workgroup> tile_b: array<array<${I.type.storage}, ${d}>, ${d}>;
  ${x.mainStart([d,d,1])}
    let tile_col_start = (workgroup_index % uniforms.num_tile_n) * ${d};
    let tile_row_start = (workgroup_index / uniforms.num_tile_n) * ${d};
    let num_tiles = (uniforms.K - 1) / ${d} + 1;
    var k_start = 0u;
    var value = ${C.type.value}(0);
    for (var t: u32 = 0u; t < num_tiles; t++) {
      ${U}
      k_start = k_start + ${d};
      workgroupBarrier();

      for (var k: u32 = 0u; k < ${d}; k++) {
        ${v}
      }
      workgroupBarrier();
    }

    ${q}
    let m = tile_row_start + local_id.y;
    let n = tile_col_start + local_id.x;
    ${S!=null?`let cOffset = ${S.broadcastedIndicesToOffset("vec2(m, n)",C)}; value += ${C.type.value}(uniforms.beta) * ${S.getByOffset("cOffset")};`:""}
    if (m < uniforms.M && n < uniforms.N) {
      output[m * uniforms.N + n] = value;
    }
  }`};return h?{name:"GemmShared",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:_},getRunData:()=>({outputs:[{dims:u,dataType:e[0].dataType}],dispatchGroup:{x:p*m},programUniforms:y}),getShaderSource:T}:{name:"Gemm",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:_},getRunData:()=>({outputs:[{dims:u,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(g/64)},programUniforms:y}),getShaderSource:$}},lh=e=>{let t=e.transA,r=e.transB,i=e.alpha,a=e.beta;return{transA:t,transB:r,alpha:i,beta:a,cacheKey:`${e.transA};${e.transB};${e.alpha===1}`}},dh=(e,t)=>{al(e.inputs),e.compute(nl(e.inputs,t))}}),Xe,it,bt,$t,sl,ol,ul,ll,dl,pl,cl,hl,ph,ch,by=P(()=>{J(),re(),ve(),ie(),[Xe,it,bt,$t]=[0,1,2,3],sl=e=>{if(e[0].dims.length!==4)throw new Error("only 4-D tensor is supported.");if(e[0].dims.length!==e[1].dims.length)throw new Error("input dimensions must be equal to grid dimensions");if(e[0].dims.length-2!==e[1].dims[e[1].dims.length-1])throw new Error(`last dimension of grid must be equal to ${e[0].dims.length-2}`);if(e[0].dims[0]!==e[1].dims[0])throw new Error("grid batch size must match input batch size")},ol=`
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
`,ul=e=>`
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
`,ll=e=>`
  fn gs_denormalize(n: f32, length: i32) -> f32 {
    ${e.alignCorners===0?`
    // alignCorners: false => [-1, 1] to [-0.5, length - 0.5]
    return ((n + 1.0) * f32(length) - 1.0) / 2.0;
    `:`
    // alignCorners: true => [-1, 1] to [0, length - 1]
    return (n + 1.0) / 2.0 * (f32(length - 1));
    `}
  }
`,dl=e=>`
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
`,pl=(e,t,r)=>`
  fn pixel_at_grid(r: i32, c: i32, H: i32, W: i32, batch: u32, channel: u32, border: vec4<f32>) -> ${t} {
     var pixel = ${t}(0);
     var indices = vec4<u32>(0);
     indices[${Xe}] = batch;
     indices[${it}] = channel;`+(()=>{switch(r.paddingMode){case"zeros":return`
          if (r >= 0 && r < H && c >=0 && c < W) {
            indices[${bt}] = u32(r);
            indices[${$t}] = u32(c);
          } else {
            return ${t}(0);
          }
        `;case"border":return`
          indices[${bt}] = u32(clamp(r, 0, H - 1));
          indices[${$t}] = u32(clamp(c, 0, W - 1));
        `;case"reflection":return`
          indices[${bt}] = gs_reflect(r, border[1], border[3]);
          indices[${$t}] = gs_reflect(c, border[0], border[2]);
        `;default:throw new Error(`padding mode ${r.paddingMode} is not supported`)}})()+`
    return ${e.getByIndices("indices")};
  }
`,cl=(e,t,r)=>(()=>{switch(r.mode){case"nearest":return`
          let result = pixel_at_grid(i32(round(y)), i32(round(x)), H_in, W_in, indices[${Xe}], indices[${it}], border);
        `;case"bilinear":return`
          let x1 = i32(floor(x));
          let y1 = i32(floor(y));
          let x2 = x1 + 1;
          let y2 = y1 + 1;

          let p11 = pixel_at_grid(y1, x1, H_in, W_in, indices[${Xe}], indices[${it}], border);
          let p12 = pixel_at_grid(y1, x2, H_in, W_in, indices[${Xe}], indices[${it}], border);
          let p21 = pixel_at_grid(y2, x1, H_in, W_in, indices[${Xe}], indices[${it}], border);
          let p22 = pixel_at_grid(y2, x2, H_in, W_in, indices[${Xe}], indices[${it}], border);

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
              p[h][w] = pixel_at_grid(h + y0, w + x0, H_in, W_in, indices[${Xe}], indices[${it}], border);
            }
          }

          let dx = x - f32(x0 + 1);
          let dy = y - f32(y0 + 1);
          let result = gs_bicubic_interpolate(p, dx, dy);
        `;default:throw new Error(`mode ${r.mode} is not supported`)}})()+`${e.setByOffset("global_idx","result")}`,hl=(e,t)=>{let r=N("x",e[0].dataType,e[0].dims.length),i=[e[1].dims[0],e[1].dims[1],e[1].dims[2]],a=N("grid",e[1].dataType,i.length,2),n=[e[0].dims[0],e[0].dims[1],e[1].dims[1],e[1].dims[2]];t.format==="NHWC"&&(n=[e[0].dims[0],e[1].dims[1],e[1].dims[2],e[0].dims[3]],[Xe,it,bt,$t]=[0,3,1,2]);let s=F("output",e[0].dataType,n.length),u=r.type.value,d=O.size(n),p=[{type:12,data:d},...K(e[0].dims,i,n)],m=h=>`
  ${h.registerUniform("output_size","u32").declareVariables(r,a,s)}
  ${ol}
  ${ul(u)}
  ${ll(t)}
  ${dl(t)}
  ${pl(r,u,t)}

  ${h.mainStart()}
    ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let H_in = i32(uniforms.x_shape[${bt}]);
      let W_in = i32(uniforms.x_shape[${$t}]);

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
      var grid_indices = vec3<u32>(indices[${Xe}], indices[${bt}], indices[${$t}]);
      let nxy = ${a.getByIndices("grid_indices")};
      var x = gs_denormalize(f32(nxy[0]), W_in);
      var y = gs_denormalize(f32(nxy[1]), H_in);

      ${cl(s,u,t)}
  }`;return{name:"GridSample",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:["type","type"]},getRunData:h=>{let g=O.size(n);return{outputs:[{dims:n,dataType:h[0].dataType}],dispatchGroup:{x:Math.ceil(g/64)},programUniforms:p}},getShaderSource:m}},ph=(e,t)=>{sl(e.inputs),e.compute(hl(e.inputs,t))},ch=e=>he({alignCorners:e.align_corners,mode:e.mode,paddingMode:e.padding_mode,format:e.format})}),Ce,fl,hh,Ki,ml,sr,fh,mh=P(()=>{J(),re(),ve(),qa(),Va(),ie(),gt(),Ce=(e,t)=>e.length>t&&e[t].dims.length>0?e[t]:void 0,fl=(e,t)=>{let r=e[0],i=Ce(e,1),a=Ce(e,2),n=Ce(e,3),s=Ce(e,4),u=Ce(e,5),d=Ce(e,6),p=Ce(e,7);if(r.dims.length!==3&&r.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let m=r.dims[0],h=r.dims[1],g=r.dims.length===3?r.dims[2]:t.numHeads*r.dims[4],y=h,_=0,$=0,T=Math.floor(g/t.numHeads);if(d&&p&&O.size(d.dims)&&O.size(p.dims)){if(d.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(d.dims[0]!==m||d.dims[1]!==t.numHeads||d.dims[3]!==T)throw new Error('Input "past_key" shape (batch_size, num_heads, past_sequence_length, head_size)');if(p.dims[0]!==m||p.dims[1]!==t.numHeads||p.dims[3]!==T)throw new Error('Input "past_value" shape (batch_size, num_heads, past_sequence_length, head_size)');if(d.dims[2]!==p.dims[2])throw new Error('Input "past_key" and "past_value" shall have same dim 2 (past_sequence_length)');if(p.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');_=d.dims[2],$=d.dims[2]}else if(d&&O.size(d.dims)||p&&O.size(p.dims))throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let x;if(i&&O.size(i.dims)>0){if(r.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(i.dims.length<3||i.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==i.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(i.dims.length===3){if(i.dims[2]!==r.dims[2])throw new Error('Input "query" and "key" shall have same dim 2 (hidden_size)');x=2,y=i.dims[1]}else if(i.dims.length===5){if(i.dims[2]!==t.numHeads||i.dims[3]!==2||i.dims[4]!==T)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(a)throw new Error('Expect "value" be none when "key" has packed kv format.');x=5,y=i.dims[1]}else{if(i.dims[1]!==t.numHeads||i.dims[3]!==T)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');x=0,y=i.dims[2]}}else{if(r.dims.length!==5)throw new Error('Input "query" is expected to have 5 dimensions when key is empty');if(r.dims[2]!==t.numHeads||r.dims[3]!==3)throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');x=3}if(n&&O.size(n.dims)>0){if(n.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimension');if(i&&i.dims.length===5&&i.dims[3]===2)throw new Error("bias is not allowed for packed kv.")}let w=_+y,I=0;if(s&&O.size(s.dims)>0){I=8;let A=s.dims;throw A.length===1?A[0]===m?I=1:A[0]===3*m+2&&(I=3):A.length===2&&A[0]===m&&A[1]===w&&(I=5),I===8?new Error('Input "key_padding_mask" shape shall be (batch_size) or (batch_size, total_sequence_length)'):new Error("Mask not supported")}let S=!1,E=g;if(a&&O.size(a.dims)>0){if(a.dims.length!==3&&a.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==a.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(a.dims.length===3){if(y!==a.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');E=a.dims[2]}else{if(y!==a.dims[2])throw new Error('Input "key" and "value" shall have the same dim 2 (kv_sequence_length)');E=a.dims[1]*a.dims[3],S=!0}}let C=!1;if(s&&O.size(s.dims)>0)throw new Error("Key padding mask is not supported");if(u&&O.size(u.dims)>0){if(u.dims.length!==4)throw new Error('Input "attention_bias" is expected to have 4 dimensions');if(u.dims[0]!==m||u.dims[1]!==t.numHeads||u.dims[2]!==h||u.dims[3]!==w)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:m,sequenceLength:h,pastSequenceLength:_,kvSequenceLength:y,totalSequenceLength:w,maxSequenceLength:$,inputHiddenSize:0,hiddenSize:g,vHiddenSize:E,headSize:T,vHeadSize:Math.floor(E/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:I,scale:t.scale,broadcastResPosBias:C,passPastInKv:S,qkvFormat:x}},hh=e=>he({...e}),Ki=he({perm:[0,2,1,3]}),ml=(e,t,r,i,a,n,s)=>{let u=[i,a,n],d=O.size(u),p=[{type:12,data:d},{type:12,data:s},{type:12,data:n}],m=h=>{let g=F("qkv_with_bias",t.dataType,u),y=N("qkv",t.dataType,u),_=N("bias",r.dataType,u),$=[{name:"output_size",type:"u32"},{name:"bias_offset",type:"u32"},{name:"hidden_size",type:"u32"}];return`
  ${h.registerUniforms($).declareVariables(y,_,g)}
  ${h.mainStart()}
    ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let bias_offset_idx = (global_idx % uniforms.hidden_size) + uniforms.bias_offset;

    qkv_with_bias[global_idx] = qkv[global_idx] + bias[bias_offset_idx];
  }`};return e.compute({name:"MultiHeadAttentionAddBias",shaderCache:{inputDependencies:["type","type"]},getRunData:()=>({outputs:[{dims:u,dataType:t.dataType,gpuDataType:0}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:p}),getShaderSource:m},{inputs:[t,r],outputs:[-1]})[0]},sr=(e,t,r,i,a,n,s,u)=>{let d=n;if(s&&O.size(s.dims)>0){if(i===1)throw new Error("AddBiasReshape is not implemented. Please export your model with packed QKV or KV");return d=ml(e,n,s,t,i,r*a,u),d=d.reshape([t,i,r,a]),r===1||i===1?d:e.compute(Ne(d,Ki.perm),{inputs:[d],outputs:[-1]})[0]}else return n.dims.length===3&&(d=n.reshape([t,i,r,a])),r===1||i===1?d:e.compute(Ne(d,Ki.perm),{inputs:[d],outputs:[-1]})[0]},fh=(e,t)=>{let r=fl(e.inputs,t),i=e.inputs[0],a=Ce(e.inputs,1),n=Ce(e.inputs,2),s=Ce(e.inputs,3),u=Ce(e.inputs,4),d=Ce(e.inputs,5),p=Ce(e.inputs,6),m=Ce(e.inputs,7);if(i.dims.length===5)throw new Error("Packed QKV is not implemented");if(a?.dims.length===5)throw new Error("Packed KV is not implemented");let h=a&&n&&a.dims.length===4&&n.dims.length===4,g=sr(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,i,s,0);if(h)return lr(e,g,a,n,u,void 0,p,m,d,r);if(!a||!n)throw new Error("key and value must be provided");let y=sr(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.headSize,a,s,r.hiddenSize),_=sr(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.vHeadSize,n,s,2*r.hiddenSize);lr(e,g,y,_,u,void 0,p,m,d,r)}}),gl,yl,_l,wl,ka,gh,yh,_h=P(()=>{J(),re(),ve(),ie(),gl=e=>{if(!e||e.length<1)throw new Error("too few inputs")},yl=(e,t)=>{let r=[],i=t.numOutputs;return e[1].dims[0]>0&&(e[1].getBigInt64Array().forEach(a=>r.push(Number(a))),i=r.length),he({numOutputs:i,axis:t.axis,splitSizes:r})},_l=e=>`
fn calculateOutputIndex(index: u32) -> u32 {
    for (var i: u32 = 0u; i < ${e}u; i += 1u ) {
    if (index < ${j("uniforms.size_in_split_axis","i",e)}) {
        return i;
    }
    }
    return ${e}u;
}`,wl=e=>{let t=e.length,r=[];for(let i=0;i<t;++i){let a=e[i].setByIndices("indices","input[global_idx]");t===1?r.push(a):i===0?r.push(`if (output_number == ${i}u) { ${a} }`):i===t-1?r.push(`else { ${a} }`):r.push(`else if (output_number == ${i}) { ${a} }`)}return`
      fn writeBufferData(output_number: u32, indices: ${e[0].type.indices}, global_idx: u32) {
        ${r.join(`
`)}
      }`},ka=(e,t)=>{let r=e[0].dims,i=O.size(r),a=e[0].dataType,n=O.normalizeAxis(t.axis,r.length),s=new Array(t.numOutputs),u=N("input",a,r.length),d=new Array(t.numOutputs),p=[],m=[],h=0,g=[{type:12,data:i}];for(let _=0;_<t.numOutputs;_++){h+=t.splitSizes[_],d[_]=h;let $=r.slice();$[n]=t.splitSizes[_],m.push($),s[_]=F(`output${_}`,a,$.length),p.push({dims:m[_],dataType:e[0].dataType})}g.push({type:12,data:d},...K(r,...m));let y=_=>`
  ${_.registerUniform("input_size","u32").registerUniform("size_in_split_axis","u32",d.length).declareVariables(u,...s)}
  ${_l(d.length)}
  ${wl(s)}

  ${_.mainStart()}
    ${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.input_size")}

    var indices = ${u.offsetToIndices("global_idx")};
    var index = ${u.indicesGet("indices",n)};
    let output_number = calculateOutputIndex(index);
    if (output_number != 0) {
      index -= ${j("uniforms.size_in_split_axis","output_number - 1u",d.length)};
      ${u.indicesSet("indices",n,"index")};
    }
    writeBufferData(output_number, indices, global_idx);
  }`;return{name:"Split",shaderCache:{hint:t.cacheKey,inputDependencies:["rank"]},getShaderSource:y,getRunData:()=>({outputs:p,dispatchGroup:{x:Math.ceil(i/64)},programUniforms:g})}},gh=(e,t)=>{gl(e.inputs);let r=e.inputs.length===1?t:yl(e.inputs,t);e.compute(ka(e.inputs,r),{inputs:[0]})},yh=e=>{let t=e.axis,r=e.splitSizes,i=e.numOutputs<0?r.length:e.numOutputs;if(i!==r.length)throw new Error("numOutputs and splitSizes length must be equal");return he({axis:t,numOutputs:i,splitSizes:r})}}),bl,Gr,wh,bh=P(()=>{J(),re(),ve(),ie(),bl=(e,t)=>{let[r,i,a,n]=e,{numHeads:s,rotaryEmbeddingDim:u}=t;if(r.dims.length!==3&&r.dims.length!==4)throw new Error(`Input 'x' is expected to have 3 or 4 dimensions, got ${r.dims.length}`);if(!O.areEqual(i.dims,[])&&!O.areEqual(i.dims,[1])&&i.dims.length!==2)throw new Error(`Input 'position_ids' is expected to have 0, 1, or 2 dimensions, got ${i.dims.length}`);if(a.dims.length!==2)throw new Error(`Input 'cos_cache' is expected to have 2 dimensions, got ${a.dims.length}`);if(n.dims.length!==2)throw new Error(`Input 'sin_cache' is expected to have 2 dimensions, got ${n.dims.length}`);if(!O.areEqual(a.dims,n.dims))throw new Error("Inputs 'cos_cache' and 'sin_cache' are expected to have the same shape");if(u>0&&s===0)throw new Error("num_heads must be provided if rotary_embedding_dim is specified");let d=r.dims[0],p=r.dims[r.dims.length-2],m=a.dims[0],h=O.sizeFromDimension(r.dims,1)/p,g=u===0?a.dims[1]*2:h/s;if(u>g)throw new Error("rotary_embedding_dim must be less than or equal to head_size");if(i.dims.length===2){if(d!==i.dims[0])throw new Error(`Input 'position_ids' dimension 0 should be of size batch_size, got ${i.dims[0]}`);if(p!==i.dims[1])throw new Error(`Input 'position_ids' dimension 1 should be of size sequence_length, got ${i.dims[1]}`)}if(g/2!==a.dims[1]&&u/2!==a.dims[1])throw new Error(`Input 'cos_cache' dimension 1 should be same as head_size / 2 or rotary_embedding_dim / 2, got ${a.dims[1]}`);if(p>m)throw new Error("Updating cos_cache and sin_cache in RotaryEmbedding is not currently supported")},Gr=(e,t)=>{let{interleaved:r,numHeads:i,rotaryEmbeddingDim:a,scale:n}=t,s=e[0].dims[0],u=O.sizeFromDimension(e[0].dims,1),d=e[0].dims[e[0].dims.length-2],p=u/d,m=e[2].dims[1],h=a===0?m*2:p/i,g=new Array(s,d,p/h,h-m),y=O.computeStrides(g),_=[{type:1,data:n},{type:12,data:g},{type:12,data:y},...e[0].dims.length===3?new Array({type:12,data:[u,p,h,1]}):[],...e[0].dims.length===4?new Array({type:12,data:[u,h,d*h,1]}):[],...K(e[0].dims,e[1].dims,e[2].dims,e[3].dims,e[0].dims)],$=T=>{let x=N("input",e[0].dataType,e[0].dims.length),w=N("position_ids",e[1].dataType,e[1].dims.length),I=N("cos_cache",e[2].dataType,e[2].dims.length),S=N("sin_cache",e[3].dataType,e[3].dims.length),E=F("output",e[0].dataType,e[0].dims.length);return T.registerUniforms([{name:"scale",type:"f32"},{name:"global_shape",type:"u32",length:g.length},{name:"global_strides",type:"u32",length:y.length},{name:"input_output_strides",type:"u32",length:y.length}]),`
        ${T.declareVariables(x,w,I,S,E)}

        ${T.mainStart(qt)}
          let half_rotary_emb_dim = uniforms.${I.name}_shape[1];
          let bsnh = global_idx / uniforms.global_strides % uniforms.global_shape;
          let size = uniforms.global_shape[0] * uniforms.global_strides[0];
          ${T.guardAgainstOutOfBoundsWorkgroupSizes("size")}

          if (bsnh[3] < half_rotary_emb_dim) {
            let position_ids_idx =
                ${w.broadcastedIndicesToOffset("bsnh.xy",F("",w.type.tensor,2))};
            let position_id =
                u32(${w.getByOffset("position_ids_idx")}) + select(0, bsnh[1], position_ids_idx == 0);
            let i = dot(bsnh, uniforms.input_output_strides) + select(0, bsnh[3], ${r});
            let j = i + select(half_rotary_emb_dim, 1, ${r});
            let re = ${x.getByOffset("i")} * ${I.get("position_id","bsnh[3]")} -
                ${x.getByOffset("j")} * ${S.get("position_id","bsnh[3]")};
            ${E.setByOffset("i","re")}
            let im = ${x.getByOffset("i")} * ${S.get("position_id","bsnh[3]")} +
                ${x.getByOffset("j")} * ${I.get("position_id","bsnh[3]")};
            ${E.setByOffset("j","im")}
          } else {
            let k = dot(bsnh, uniforms.input_output_strides) + half_rotary_emb_dim;
            ${E.setByOffset("k",x.getByOffset("k"))}
          }
        }`};return{name:"RotaryEmbedding",shaderCache:{hint:he({interleaved:r}).cacheKey,inputDependencies:["rank","rank","rank","rank"]},getShaderSource:$,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(O.size(g)/qt)},programUniforms:_})}},wh=(e,t)=>{bl(e.inputs,t),e.compute(Gr(e.inputs,t))}}),$l,vl,Qi,xl,$h,$y=P(()=>{ve(),J(),Va(),mh(),_h(),gt(),bh(),ie(),$l=(e,t)=>{if(t.doRotary&&e.length<=7)throw new Error("cos_cache and sin_cache inputs are required if do_rotary is specified");let r=e[0],i=e[1],a=e[2],n=e[3],s=e[4];if(t.doRotary!==0&&e.length<=7)throw new Error("cos_cast and sin_cache are expected if do_rotary attribute is non-zero");if(t.localWindowSize!==-1)throw new Error("Local attention is not supported");if(t.softcap!==0)throw new Error("Softcap is not supported");if(t.rotaryInterleaved!==0)throw new Error("Rotary interleaved is not supported");if(t.smoothSoftmax)throw new Error("Smooth softmax is not supported");if(r.dims.length!==3&&r.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let u=!1,d=r.dims[0],p=r.dims[1],m=r.dims.length===3?u?r.dims[2]/3:r.dims[2]:t.numHeads*r.dims[4],h=p,g=0,y=!i||i.dims.length===0,_=Math.floor(y?m/(t.numHeads+2*t.kvNumHeads):m/t.numHeads);y&&(m=_*t.numHeads);let $=n&&n.dims.length!==0,T=s&&s.dims.length!==0;if($&&n.dims.length===4&&n.dims[0]===d&&n.dims[1]!==t.kvNumHeads&&n.dims[2]===t.kvNumHeads&&n.dims[3]===_)throw new Error("BSNH pastKey/pastValue is not supported");if($&&T){if(n.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(s.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');g=n.dims[2]}else if($||T)throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let x=1;if(i&&i.dims.length>0){if(r.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(i.dims.length<3||i.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==i.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(i.dims.length===3){if(r.dims[2]%i.dims[2]!==0)throw new Error('Dimension 2 of "query" should be a multiple of "key"');h=i.dims[1]}else if(i.dims.length===5){if(i.dims[2]!==t.numHeads||i.dims[3]!==2||i.dims[4]!==_)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(a)throw new Error('Expect "value" be none when "key" has packed kv format.');h=i.dims[1]}else{if(i.dims[1]!==t.numHeads||i.dims[3]!==_)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');h=i.dims[2]}}else{if(r.dims.length!==3&&r.dims.length!==5)throw new Error('Input "query" is expected to have 3 or 5 dimensions when key is empty');if(r.dims.length===5&&(r.dims[2]!==t.numHeads||r.dims[3]!==3))throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');x=3}let w=0,I=!1,S=t.kvNumHeads?_*t.kvNumHeads:m;if(a&&a.dims.length>0){if(a.dims.length!==3&&a.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==a.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(a.dims.length===3){if(h!==a.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');S=a.dims[2]}else{if(h!==a.dims[2])throw new Error('Input "past_key" and "past_value" shall have the same dim 2 (kv_sequence_length)');S=a.dims[1]*a.dims[3],I=!0}}let E=e.length>4?e[5]:void 0;if(E&&E.dims.length!==1&&E.dims[0]!==d)throw new Error('Input "seqlens" is expected to have 1 dimension and the same dim 0 as batch_size');return{batchSize:d,sequenceLength:p,pastSequenceLength:g,kvSequenceLength:h,totalSequenceLength:-1,maxSequenceLength:-1,inputHiddenSize:0,hiddenSize:m,vHiddenSize:S,headSize:_,vHeadSize:Math.floor(S/t.kvNumHeads),numHeads:t.numHeads,kvNumHeads:t.kvNumHeads,nReps:t.numHeads/t.kvNumHeads,pastPresentShareBuffer:!1,maskType:w,scale:t.scale,broadcastResPosBias:!1,passPastInKv:I,qkvFormat:x}},vl=he({perm:[0,2,1,3]}),Qi=(e,t,r)=>{let i=t,a=r.kvNumHeads;return t.dims.length===3&&r.kvSequenceLength!==0&&(i=t.reshape([r.batchSize,r.kvSequenceLength,a,r.headSize]),i=e.compute(Ne(i,vl.perm),{inputs:[i],outputs:[-1]})[0]),i},xl=(e,t,r,i)=>{let a=7,n=["type","type"],s=[e*t],u=e*t,d=[{type:12,data:u},{type:12,data:t},{type:12,data:e}],p=m=>{let h=N("seq_lens",r.dataType,r.dims),g=N("total_seq_lens",i.dataType,i.dims),y=F("pos_ids",a,s),_=[{name:"output_size",type:"u32"},{name:"sequence_length",type:"u32"},{name:"batch_size",type:"u32"}];return`
  ${m.registerUniforms(_).declareVariables(h,g,y)}
  ${m.mainStart()}
    ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let total_sequence_length = u32(${g.getByOffset("0")});
    let is_subsequent_prompt = uniforms.sequence_length > 1 && uniforms.sequence_length != total_sequence_length;
    let is_first_prompt = !is_subsequent_prompt && uniforms.sequence_length == total_sequence_length;
    let batch_idx = global_idx / uniforms.sequence_length;
    let sequence_idx = i32(global_idx % uniforms.sequence_length);
    var pos_id: i32 = 0;
    let seqlen = ${h.getByOffset("batch_idx")};
    let total_seqlen = seqlen + 1;
    if (is_first_prompt) {
      if (sequence_idx < total_seqlen) {
        pos_id = sequence_idx;
      } else {
        pos_id = 1;
      }
      ${y.setByOffset("global_idx","pos_id")}
    } else if (is_subsequent_prompt) {
      let past_seqlen = total_seqlen - i32(uniforms.sequence_length);
      if (past_seqlen + sequence_idx < total_seqlen) {
        pos_id = past_seqlen + sequence_idx;
      } else {
        pos_id = 1;
      }
      ${y.setByOffset("global_idx","pos_id")}
    } else if (global_idx < uniforms.batch_size) {
      ${y.setByOffset("global_idx","seqlen")}
    };
  }
  `};return{name:"GeneratePositionIds",shaderCache:{hint:`${e};${t}`,inputDependencies:n},getRunData:()=>({outputs:[{dims:s,dataType:a}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:d}),getShaderSource:p}},$h=(e,t)=>{let r=$l(e.inputs,t);if(e.inputs[0].dims.length===5)throw new Error("Packed QKV is not implemented");if(e.inputs[1]?.dims.length===5)throw new Error("Packed KV is not implemented");let i=e.inputs[0],a=e.inputs[1]&&e.inputs[1].dims.length>0?e.inputs[1]:void 0,n=e.inputs[2]&&e.inputs[2].dims.length>0?e.inputs[2]:void 0,s=e.inputs[3]&&e.inputs[3].dims.length!==0?e.inputs[3]:void 0,u=e.inputs[4]&&e.inputs[4].dims.length!==0?e.inputs[4]:void 0,d=e.inputs.length>4?e.inputs[5]:void 0,p=e.inputs.length>5?e.inputs[6]:void 0,m=r.kvNumHeads?r.kvNumHeads:r.numHeads,h=he({axis:2,numOutputs:3,splitSizes:[r.numHeads*r.headSize,m*r.headSize,m*r.headSize]}),[g,y,_]=!a&&!n?e.compute(ka([i],h),{inputs:[i],outputs:[-1,-1,-1]}):[i,a,n],$,T;if(t.doRotary){let S=e.compute(xl(r.batchSize,r.sequenceLength,d,p),{inputs:[d,p],outputs:[-1]})[0],E=e.inputs[7],C=e.inputs[8],A=he({interleaved:t.rotaryInterleaved!==0,numHeads:r.numHeads,rotaryEmbeddingDim:0,scale:t.scale}),v=[g,S,E,C],U=[-1];$=e.compute(Gr(v,A),{inputs:v,outputs:U})[0],v.splice(0,1,y);let q=he({interleaved:t.rotaryInterleaved!==0,numHeads:r.kvNumHeads,rotaryEmbeddingDim:0,scale:t.scale});T=e.compute(Gr(v,q),{inputs:v,outputs:U})[0]}let x=sr(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,t.doRotary?$:g,void 0,0),w=Qi(e,t.doRotary?T:y,r),I=Qi(e,_,r);lr(e,x,w,I,void 0,void 0,s,u,void 0,r,d,p)}}),Zi,Sl,Tl,vh,vy=P(()=>{J(),re(),gt(),ie(),Zi=(e,t,r,i,a,n,s,u)=>{let d=$e(n),p=d===1?"f32":`vec${d}f`,m=d===1?"vec2f":`mat2x${d}f`,h=a*s,g=64;h===1&&(g=256);let y=[a,s,n/d],_=[a,s,2],$=["rank","type","type"],T=[];T.push(...K(y,_));let x=w=>{let I=N("x",t.dataType,3,d),S=N("scale",r.dataType,r.dims),E=N("bias",i.dataType,i.dims),C=F("output",1,3,2),A=[I,S,E,C];return`
  var<workgroup> workgroup_shared : array<${m}, ${g}>;
  const workgroup_size = ${g}u;
  ${w.declareVariables(...A)}
  ${w.mainStart(g)}
    let batch = workgroup_index / uniforms.x_shape[1];
    let channel = workgroup_index % uniforms.x_shape[1];
    let hight = uniforms.x_shape[2];
    // initialize workgroup memory
    var sum = ${p}(0);
    var squared_sum = ${p}(0);
    for (var h = local_idx; h < hight; h += workgroup_size) {
      let value = ${p}(${I.get("batch","channel","h")});
      sum += value;
      squared_sum += value * value;
    }
    workgroup_shared[local_idx] = ${m}(sum, squared_sum);
    workgroupBarrier();

    for (var currSize = workgroup_size >> 1;  currSize > 0; currSize = currSize >> 1) {
      if (local_idx < currSize) {
        workgroup_shared[local_idx] = workgroup_shared[local_idx] + workgroup_shared[local_idx + currSize];
      }
      workgroupBarrier();
    }
    if (local_idx == 0) {
      let sum_final = ${mt("workgroup_shared[0][0]",d)} / f32(hight * ${d});
      let squared_sum_final = ${mt("workgroup_shared[0][1]",d)} / f32(hight * ${d});

      let inv_std_dev = inverseSqrt(squared_sum_final - sum_final * sum_final + f32(${u}));
      let channel_scale = inv_std_dev * f32(scale[channel]);
      let channel_shift = f32(bias[channel]) - sum_final * channel_scale;
      output[workgroup_index] = vec2f(channel_scale, channel_shift);
    }
  }`};return e.compute({name:"InstanceNormComputeChannelScaleShift",shaderCache:{hint:`${d};${u};${g}`,inputDependencies:$},getRunData:()=>({outputs:[{dims:_,dataType:1}],dispatchGroup:{x:h},programUniforms:T}),getShaderSource:x},{inputs:[t,r,i],outputs:[-1]})[0]},Sl=(e,t,r)=>{let i=t[0].dims,a=i,n=2,s=i[0],u=i[1],d=O.sizeFromDimension(i,n),p=$e(d),m=O.size(a)/p,h=Zi(e,t[0],t[1],t[2],s,d,u,r.epsilon),g=[s,u,d/p],y=[s,u],_=["type","none"],$=T=>{let x=N("x",t[0].dataType,g.length,p),w=N("scale_shift",1,y.length,2),I=F("output",t[0].dataType,g.length,p),S=[x,w,I];return`
  ${T.registerUniform("output_size","u32").declareVariables(...S)}
  ${T.mainStart()}
  ${T.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let outputIndices = ${I.offsetToIndices("global_idx")};
      let batch = outputIndices[0];
      let channel = outputIndices[1];
      let scale_shift = ${w.getByIndices("vec2<u32>(batch, channel)")};
      let value = ${x.getByOffset("global_idx")} * ${I.type.value}(scale_shift.x) + ${I.type.value}(scale_shift.y);
      ${I.setByOffset("global_idx","value")};
  }`};e.compute({name:"InstanceNormalization",shaderCache:{hint:`${p}`,inputDependencies:_},getRunData:()=>({outputs:[{dims:a,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(m/64)},programUniforms:[{type:12,data:m},...K(g,y,g)]}),getShaderSource:$},{inputs:[t[0],h]})},Tl=(e,t,r)=>{let i=t[0].dims,a=i,n=i[0],s=i[i.length-1],u=O.sizeFromDimension(i,1)/s,d=$e(s),p=O.size(a)/d,m=[{type:12,data:u},{type:12,data:Math.floor(s/d)}],h=["type","type"],g=!1,y=[0,i.length-1];for(let x=0;x<i.length-2;x++)g=g||i[x+1]!==1,y.push(x+1);g=g&&i[i.length-1]!==1;let _=g?e.compute(Ne(e.inputs[0],y),{inputs:[e.inputs[0]],outputs:[-1]})[0]:e.inputs[0].reshape(Array.from({length:i.length},(x,w)=>i[y[w]])),$=Zi(e,_,t[1],t[2],n,u,s,r.epsilon),T=x=>{let w=Te(t[0].dataType),I=d===1?"vec2f":`mat${d}x2f`,S=A=>{let v=A===0?"x":"y",U=d===1?"f32":`vec${d}f`;switch(d){case 1:return`${w}(${U}(scale.${v}))`;case 2:return`vec2<${w}>(${U}(scale[0].${v}, scale[1].${v}))`;case 4:return`vec4<${w}>(${U}(scale[0].${v}, scale[1].${v}, scale[2].${v}, scale[3].${v}))`;default:throw new Error(`Not supported compoents ${d}`)}},E=N("input",t[0].dataType,t[0].dims,d),C=F("output",t[0].dataType,a,d);return`
  @group(0) @binding(0) var<storage, read> input : array<${E.type.storage}>;
  @group(0) @binding(1) var<storage, read> scale_input : array<${I}>;
  @group(0) @binding(2) var<storage, read_write> output : array<${C.type.storage}>;
  struct Uniforms {H: u32, C : u32};
  @group(0) @binding(3) var<uniform> uniforms: Uniforms;

  ${x.mainStart()}
    let current_image_number = global_idx / (uniforms.C * uniforms.H);
    let current_channel_number = global_idx % uniforms.C;

    let scale_offset = current_image_number * uniforms.C + current_channel_number;
    let scale = scale_input[scale_offset];
    output[global_idx] = fma(input[global_idx], ${S(0)}, ${S(1)});
  }`};e.compute({name:"InstanceNormalizationNHWC",shaderCache:{hint:`${d}`,inputDependencies:h},getRunData:()=>({outputs:[{dims:a,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:m}),getShaderSource:T},{inputs:[t[0],$]})},vh=(e,t)=>{t.format==="NHWC"?Tl(e,e.inputs,t):Sl(e,e.inputs,t)}}),kl,Il,xh,xy=P(()=>{J(),re(),ie(),kl=e=>{if(!e||e.length<2)throw new Error("layerNorm requires at least 2 inputs.")},Il=(e,t,r)=>{let i=t.simplified,a=e[0].dims,n=e[1],s=!i&&e[2],u=a,d=O.normalizeAxis(t.axis,a.length),p=O.sizeToDimension(a,d),m=O.sizeFromDimension(a,d),h=O.size(n.dims),g=s?O.size(s.dims):0;if(h!==m||s&&g!==m)throw new Error(`Size of X.shape()[axis:] == ${m}.
       Size of scale and bias (if provided) must match this.
       Got scale size of ${h} and bias size of ${g}`);let y=[];for(let E=0;E<a.length;++E)E<d?y.push(a[E]):y.push(1);let _=$e(m),$=["type","type"],T=[{type:12,data:p},{type:1,data:m},{type:12,data:Math.floor(m/_)},{type:1,data:t.epsilon}];s&&$.push("type");let x=r>1,w=r>2,I=E=>{let C=Te(e[0].dataType),A=[N("x",e[0].dataType,e[0].dims,_),N("scale",n.dataType,n.dims,_)];s&&A.push(N("bias",s.dataType,s.dims,_)),A.push(F("output",e[0].dataType,u,_)),x&&A.push(F("mean_data_output",1,y)),w&&A.push(F("inv_std_output",1,y));let v=[{name:"norm_count",type:"u32"},{name:"norm_size",type:"f32"},{name:"norm_size_vectorized",type:"u32"},{name:"epsilon",type:"f32"}];return`
  ${E.registerUniforms(v).declareVariables(...A)}
  ${E.mainStart()}
    ${E.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.norm_count")}
    let offset = global_idx * uniforms.norm_size_vectorized;
    var mean_vector = ${ya("f32",_)};
    var mean_square_vector = ${ya("f32",_)};

    for (var h: u32 = 0u; h < uniforms.norm_size_vectorized; h++) {
      let value = ${Ut(C,_,"x[h + offset]")};
      mean_vector += value;
      mean_square_vector += value * value;
    }
    let mean = ${mt("mean_vector",_)} / uniforms.norm_size;
    let inv_std_dev = inverseSqrt(${mt("mean_square_vector",_)} / uniforms.norm_size ${i?"":"- mean * mean"} + uniforms.epsilon);

    for (var j: u32 = 0; j < uniforms.norm_size_vectorized; j++) {
      let f32input = ${Ut(C,_,"x[j + offset]")};
      let f32scale = ${Ut(C,_,"scale[j]")};
      output[j + offset] = ${A[0].type.value}((f32input ${i?"":"- mean"}) * inv_std_dev * f32scale
        ${s?`+ ${Ut(C,_,"bias[j]")}`:""}
      );
    }

    ${x?"mean_data_output[global_idx] = mean":""};
    ${w?"inv_std_output[global_idx] = inv_std_dev":""};
  }`},S=[{dims:u,dataType:e[0].dataType}];return x&&S.push({dims:y,dataType:1}),w&&S.push({dims:y,dataType:1}),{name:"LayerNormalization",shaderCache:{hint:`${_};${r};${i}`,inputDependencies:$},getRunData:()=>({outputs:S,dispatchGroup:{x:Math.ceil(p/64)},programUniforms:T}),getShaderSource:I}},xh=(e,t)=>{kl(e.inputs),e.compute(Il(e.inputs,t,e.outputCount))}}),El,Sh,Sy=P(()=>{re(),Ka(),Qa(),El=e=>{if(!e||e.length!==2)throw new Error("MatMul requires 2 inputs.");if(e[0].dims[e[0].dims.length-1]!==e[1].dims[e[1].dims.length-2])throw new Error("shared dimension does not match.")},Sh=e=>{El(e.inputs);let t=Pt.calcShape(e.inputs[0].dims,e.inputs[1].dims,!0);if(!t)throw new Error("Can't use matmul on the given tensors");let r=t[t.length-1],i=e.inputs[0].dims[e.inputs[0].dims.length-1];if(r<8&&i<8)e.compute(ja(e.inputs,{activation:""},t));else{let a=t[t.length-2],n=O.size(e.inputs[0].dims.slice(0,-2)),s=O.size(e.inputs[1].dims.slice(0,-2));if(n!==1&&a===1&&s===1){let u=e.inputs[0].reshape([1,n,i]),d=e.inputs[1].reshape([1,i,r]),p=[1,n,r],m=[u,d];e.compute(Vr(m,{activation:""},t,p),{inputs:m})}else e.compute(Vr(e.inputs,{activation:""},t))}}}),zl,Cl,Al,Th,kh,Ty=P(()=>{J(),re(),ve(),ie(),zl=(e,t)=>{if(e.length<3||e.length>4)throw new Error("MatMulNBits requires 3 or 4 inputs");let r=e[0],i=r.dims.length;if(r.dims[i-1]!==t.k)throw new Error("The last dim of input shape does not match the k value");let a=Math.floor((t.k+t.blockSize-1)/t.blockSize),n=t.blockSize/8*t.bits,s=e[1];if(!O.areEqual(s.dims,[t.n,a,n]))throw new Error("The second inputs must be 3D tensor with shape N X nBlocksPerCol X blobSize");let u=e[2].dims;if(O.size(u)!==t.n*a)throw new Error("scales input size error.");if(e.length===4){let d=e[3].dims,p=t.n*(t.bits===8?a:Math.floor((a*t.bits+7)/8));if(O.size(d)!==p)throw new Error("zeroPoints input size error.")}},Cl=(e,t)=>{let r=e[0].dims,i=r.length,a=r[i-2],n=t.k,s=t.n,u=r.slice(0,i-2),d=O.size(u),p=e[1].dims[2]/4,m=e[0].dataType,h=$e(t.k),g=$e(p),y=$e(s),_=u.concat([a,s]),$=a>1&&s/y%2===0?2:1,T=O.size(_)/y/$,x=64,w=[],I=[d,a,n/h],S=O.convertShape(e[1].dims).slice();S.splice(-1,1,p/g),w.push(...K(I)),w.push(...K(S)),w.push(...K(e[2].dims)),e.length===4&&w.push(...K(O.convertShape(e[3].dims)));let E=[d,a,s/y];w.push(...K(E));let C=A=>{let v=I.length,U=N("a",e[0].dataType,v,h),q=N("b",12,S.length,g),Y=N("scales",e[2].dataType,e[2].dims.length),H=[U,q,Y],Q=e.length===4?N("zero_points",12,e[3].dims.length):void 0;Q&&H.push(Q);let R=E.length,D=F("output",e[0].dataType,R,y),G=Te(e[0].dataType),ee=(()=>{switch(h){case 1:return`array<${G}, 8>`;case 2:return`mat4x2<${G}>`;case 4:return`mat2x4<${G}>`;default:throw new Error(`${h}-component is not supported.`)}})(),Z=()=>{let M=`
          // reuse a data
            var input_offset = ${U.indicesToOffset(`${U.type.indices}(batch, row, word_offset)`)};
            var a_data: ${ee};
            for (var j: u32 = 0; j < ${8/h}; j++) {
              a_data[j] = ${U.getByOffset("input_offset")};
              input_offset++;
            }
          `;for(let L=0;L<y*$;L++)M+=`
            b_value = ${g===1?`b${L}_data`:`b${L}_data[i]`};
            b_value_lower = unpack4xU8(b_value & b_mask);
            b_value_upper = unpack4xU8((b_value >> 4) & b_mask);
            b_quantized_values = ${ee}(${Array.from({length:4},(te,oe)=>`${G}(b_value_lower[${oe}]), ${G}(b_value_upper[${oe}])`).join(", ")});
            b_dequantized_values = ${h===1?`${ee}(${Array.from({length:8},(te,oe)=>`(b_quantized_values[${oe}] - ${Q?`zero_point${L}`:"zero_point"}) * scale${L}`).join(", ")});`:`(b_quantized_values - ${ee}(${Array(8).fill(`${Q?`zero_point${L}`:"zero_point"}`).join(",")})) * scale${L};`};
            workgroup_shared[local_id.x * ${$} + ${Math.floor(L/y)}]${y>1?`[${L%y}]`:""} += ${Array.from({length:8/h},(te,oe)=>`${h===1?`a_data[${oe}] * b_dequantized_values[${oe}]`:`dot(a_data[${oe}], b_dequantized_values[${oe}])`}`).join(" + ")};
          `;return M},X=()=>{let M=`
            var col_index = col * ${y};
            ${Q?`
            let zero_point_bytes_per_col = (nBlocksPerCol + 1) / 2;
            var zero_point_byte_count: u32;
            var zero_point_word_index: u32;
            var zero_point_byte_offset: u32;
            let zero_point_nibble_offset: u32 = block & 0x1u;
            var zero_point_bits_offset: u32;
            var zero_point_word: u32;`:`
            // The default zero point is 8 for unsigned 4-bit quantization.
            let zero_point = ${G}(8);`}
            `;for(let L=0;L<y*$;L++)M+=`
            let scale${L} = ${Y.getByOffset("col_index * nBlocksPerCol + block")};
            ${Q?`
            zero_point_byte_count = col_index * zero_point_bytes_per_col + (block >> 0x1u);
            zero_point_word_index = zero_point_byte_count >> 0x2u;
            zero_point_byte_offset = zero_point_byte_count & 0x3u;
            zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_nibble_offset << 2);
            zero_point_word = ${Q.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point${L} = ${G}((zero_point_word) & 0xFu);`:""}
            col_index += 1;`;return M},de=()=>{let M=`col_index = col * ${y};`;for(let L=0;L<y*$;L++)M+=`
            let b${L}_data = ${q.getByIndices(`${q.type.indices}(col_index, block, word)`)};
            col_index += 1;`;return M+=`
            var b_value: u32;
            let b_mask: u32 = 0x0F0F0F0Fu;
            var b_value_lower: vec4<u32>;
            var b_value_upper: vec4<u32>;
            var b_quantized_values: ${ee};
            var b_dequantized_values: ${ee};`,M};return`
        var<workgroup> workgroup_shared: array<${D.type.value}, ${$*x}>;
        ${A.declareVariables(...H,D)}
        ${A.mainStart([x,1,1])}
          let output_indices = ${D.offsetToIndices(`(global_idx / ${x}) * ${$}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let nBlocksPerCol = uniforms.b_shape[1];

          for (var block = local_id.x; block < nBlocksPerCol; block += ${x}) {
            //process one block
            var word_offset: u32 = block * ${t.blockSize/h};
            ${X()}
            for (var word: u32 = 0; word < ${p}; word += ${g}) {
              ${de()}
              for (var i: u32 = 0; i < ${g}; i++) {
                ${Z()}
                word_offset += ${8/h};
              }
            }
          }
          workgroupBarrier();

          if (local_id.x < ${$}) {
            var output_value: ${D.type.value} = ${D.type.value}(0);
            var workgroup_shared_offset: u32 = local_id.x;
            for (var b: u32 = 0u; b < ${x}u; b++) {
              output_value += workgroup_shared[workgroup_shared_offset];
              workgroup_shared_offset += ${$};
            }
            ${D.setByIndices(`${D.type.indices}(batch, row, col + local_id.x)`,"output_value")};
          }
        }`};return{name:"MatMulNBits",shaderCache:{hint:`${t.blockSize};${t.bits};${h};${g};${y};${$};${x}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:_,dataType:m}],dispatchGroup:{x:T},programUniforms:w}),getShaderSource:C}},Al=(e,t)=>{let r=e[0].dims,i=r.length,a=r[i-2],n=t.k,s=t.n,u=r.slice(0,i-2),d=O.size(u),p=e[1].dims[2]/4,m=e[0].dataType,h=$e(t.k),g=$e(p),y=u.concat([a,s]),_=128,$=s%8===0?8:s%4===0?4:1,T=_/$,x=T*g*8,w=x/h,I=x/t.blockSize,S=O.size(y)/$,E=[],C=[d,a,n/h],A=O.convertShape(e[1].dims).slice();A.splice(-1,1,p/g),E.push(...K(C)),E.push(...K(A)),E.push(...K(e[2].dims)),e.length===4&&E.push(...K(O.convertShape(e[3].dims)));let v=[d,a,s];E.push(...K(v));let U=q=>{let Y=C.length,H=N("a",e[0].dataType,Y,h),Q=N("b",12,A.length,g),R=N("scales",e[2].dataType,e[2].dims.length),D=[H,Q,R],G=e.length===4?N("zero_points",12,e[3].dims.length):void 0;G&&D.push(G);let ee=v.length,Z=F("output",e[0].dataType,ee),X=Te(e[0].dataType),de=()=>{switch(h){case 1:return`
          let a_data0 = vec4<${X}>(sub_a[word_offset], sub_a[word_offset + 1], sub_a[word_offset + 2], sub_a[word_offset + 3]);
          let a_data1 = vec4<${X}>(sub_a[word_offset + 4], sub_a[word_offset + 5], sub_a[word_offset + 6], sub_a[word_offset + 7]);`;case 2:return`
          let a_data0 = vec4<${X}>(sub_a[word_offset], sub_a[word_offset + 1]);
          let a_data1 = vec4<${X}>(sub_a[word_offset + 2], sub_a[word_offset + 3]);`;case 4:return`
          let a_data0 = sub_a[word_offset];
          let a_data1 = sub_a[word_offset + 1];`;default:throw new Error(`${h}-component is not supported.`)}};return`
        var<workgroup> sub_a: array<${H.type.value}, ${w}>;
        var<workgroup> inter_results: array<array<${Z.type.value}, ${T}>, ${$}>;
        ${q.declareVariables(...D,Z)}
        ${q.mainStart([T,$,1])}
          let output_indices = ${Z.offsetToIndices(`workgroup_index * ${$}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let n_blocks_per_col = uniforms.b_shape[1];
          let num_tiles =  (n_blocks_per_col - 1) / ${I} + 1;

          // Loop over shared dimension.
          for (var tile: u32 = 0; tile < num_tiles; tile += 1) {
            let a_col_start = tile * ${w};
            // load one tile A data into shared memory.
            for (var a_offset = local_idx; a_offset < ${w}; a_offset += ${_})
            {
              let a_col = a_col_start + a_offset;
              if (a_col < uniforms.a_shape[2])
              {
                sub_a[a_offset] = ${H.getByIndices(`${H.type.indices}(batch, row, a_col)`)};
              } else {
                sub_a[a_offset] = ${H.type.value}(0);
              }
            }
            workgroupBarrier();

            // each thread process one block
            let b_row = col + local_id.y;
            let block = tile * ${I} + local_id.x;
            ${G?`
            let zero_point_bytes_per_col = (n_blocks_per_col + 1) / 2;
            let zero_point_byte_count = b_row * zero_point_bytes_per_col + (block >> 0x1u);
            let zero_point_word_index = zero_point_byte_count >> 0x2u;
            let zero_point_byte_offset = zero_point_byte_count & 0x3u;
            let zero_point_nibble_offset: u32 = block & 0x1u;
            let zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_nibble_offset << 2);
            let zero_point_word = ${G.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point = ${X}((zero_point_word) & 0xFu);`:`
            // The default zero point is 8 for unsigned 4-bit quantization.
            let zero_point = ${X}(8);`}
            let scale = ${R.getByOffset("b_row * n_blocks_per_col + block")};
            let b_data = ${Q.getByIndices(`${Q.type.indices}(b_row, block, 0)`)};
            var word_offset = local_id.x * ${t.blockSize/h};
            for (var i: u32 = 0; i < ${g}; i++) {
              ${de()}
              let b_value = ${g===1?"b_data":"b_data[i]"};
              let b_value_lower = unpack4xU8(b_value & 0x0F0F0F0Fu);
              let b_value_upper = unpack4xU8((b_value >> 4) & 0x0F0F0F0Fu);
              let b_quantized_values = mat2x4<${X}>(${Array.from({length:4},(M,L)=>`${X}(b_value_lower[${L}]), ${X}(b_value_upper[${L}])`).join(", ")});
              let b_dequantized_values = (b_quantized_values - mat2x4<${X}>(${Array(8).fill("zero_point").join(",")})) * scale;
              inter_results[local_id.y][local_id.x] += ${Array.from({length:2},(M,L)=>`${`dot(a_data${L}, b_dequantized_values[${L}])`}`).join(" + ")};
              word_offset += ${8/h};
            }
            workgroupBarrier();
          }

          if (local_idx < ${$}) {
            var output_value: ${Z.type.value} = ${Z.type.value}(0);
            for (var b = 0u; b < ${T}; b++) {
              output_value += inter_results[local_idx][b];
            }
            if (col + local_idx < uniforms.output_shape[2])
            {
              ${Z.setByIndices(`${Z.type.indices}(batch, row, col + local_idx)`,"output_value")}
            }
          }
        }`};return{name:"BlockwiseMatMulNBits32",shaderCache:{hint:`${t.blockSize};${h};${g};${T};${$}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:y,dataType:m}],dispatchGroup:{x:S},programUniforms:E}),getShaderSource:U}},Th=(e,t)=>{zl(e.inputs,t),t.blockSize===32&&e.adapterInfo.isVendor("intel")&&e.adapterInfo.isArchitecture("gen-12lp")?e.compute(Al(e.inputs,t)):e.compute(Cl(e.inputs,t))},kh=e=>he(e)}),Ol,Rl,Bl,Nl,Ml,Dl,Ul,Pl,Ih,ky=P(()=>{J(),re(),ie(),Ol=e=>{if(!e||e.length<1)throw new Error("Too few inputs");if(e[0].dataType!==1&&e[0].dataType!==10)throw new Error("Input type must be float or float16.");if(e.length>=2){let t=e[0].dims.length*2===e[1].dims[0];if(e.length===4&&(t=e[3].dims[0]*2===e[1].dims[0]),!t)throw new Error("The pads should be a 1D tensor of shape [2 * input_rank] or [2 * num_axes].")}},Rl=(e,t,r)=>{let i="";for(let a=t-1;a>=0;--a)i+=`
            k = i32(${e.indicesGet("indices",a)}) - ${j("uniforms.pads",a,r)};
            if (k < 0) {
              break;
            }
            if (k >= i32(${j("uniforms.x_shape",a,t)})) {
              break;
            }
            offset += k * i32(${j("uniforms.x_strides",a,t)});
        `;return`
          value = ${e.type.value}(uniforms.constant_value);
          for (var i = 0; i < 1; i++) {
            var offset = 0;
            var k = 0;
            ${i}
            value = x[offset];
          }
      `},Bl=(e,t,r)=>{let i="";for(let a=t-1;a>=0;--a)i+=`
                k = i32(${e.indicesGet("indices",a)}) - ${j("uniforms.pads",a,r)};
                if (k < 0) {
                  k = -k;
                }
                {
                  let _2n_1 = 2 * (i32(${j("uniforms.x_shape",a,t)}) - 1);
                  k = k % _2n_1;
                  if(k >= i32(${j("uniforms.x_shape",a,t)})) {
                    k = _2n_1 - k;
                  }
                }
                offset += k * i32(${j("uniforms.x_strides",a,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${i}
              value = x[offset];
          `},Nl=(e,t,r)=>{let i="";for(let a=t-1;a>=0;--a)i+=`
                k = i32(${e.indicesGet("indices",a)}) - ${j("uniforms.pads",a,r)};
                if (k < 0) {
                  k = 0;
                }
                if (k >= i32(${j("uniforms.x_shape",a,t)})) {
                  k = i32(${j("uniforms.x_shape",a,t)}) - 1;
                }
                offset += k * i32(${j("uniforms.x_strides",a,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${i}
              value = x[offset];
          `},Ml=(e,t,r)=>{let i="";for(let a=t-1;a>=0;--a)i+=`
                k = i32(${e.indicesGet("indices",a)}) - ${j("uniforms.pads",a,r)};
                if (k < 0)  {
                  k += i32(${j("uniforms.x_shape",a,t)}]);
                }
                if (k >= i32(${j("uniforms.x_shape",a,t)})) {
                  k -= i32(${j("uniforms.x_shape",a,t)});
                }
                offset += k * i32(${j("uniforms.x_strides",a,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${i}
              value = x[offset];
          `},Dl=(e,t,r)=>{switch(r.mode){case 0:return Rl(e,t,r.pads.length);case 1:return Bl(e,t,r.pads.length);case 2:return Nl(e,t,r.pads.length);case 3:return Ml(e,t,r.pads.length);default:throw new Error("Invalid mode")}},Ul=(e,t)=>{let r=O.padShape(e[0].dims.slice(),t.pads),i=e[0].dims,a=O.size(r),n=[{type:12,data:a},{type:6,data:t.pads}],s=e.length>=3&&e[2].data;t.mode===0&&n.push({type:s?e[2].dataType:1,data:t.value}),n.push(...K(e[0].dims,r));let u=["rank"],d=p=>{let m=F("output",e[0].dataType,r.length),h=N("x",e[0].dataType,i.length),g=h.type.value,y=Dl(m,i.length,t),_=[{name:"output_size",type:"u32"},{name:"pads",type:"i32",length:t.pads.length}];return t.mode===0&&_.push({name:"constant_value",type:s?g:"f32"}),`
            ${p.registerUniforms(_).declareVariables(h,m)}
            ${p.mainStart()}
            ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

            let indices = ${m.offsetToIndices("global_idx")};

            var value = ${g}(0);
            ${y}
            output[global_idx] = value;
        }`};return{name:"Pad",shaderCache:{hint:`${t.mode}${s}`,inputDependencies:u},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(O.size(r)/64)},programUniforms:n}),getShaderSource:d}},Pl=(e,t)=>{if(e.length>1){let r=e[1].getBigInt64Array(),i=e.length>=3&&e[2].data?e[2].dataType===10?e[2].getUint16Array()[0]:e[2].getFloat32Array()[0]:0,a=e[0].dims.length,n=new Int32Array(2*a).fill(0);if(e.length>=4){let u=e[3].getBigInt64Array();for(let d=0;d<u.length;d++)n[Number(u[d])]=Number(r[d]),n[Number(u[d])+a]=Number(r[d+u.length])}else r.forEach((u,d)=>n[Number(d)]=Number(u));let s=[];return n.forEach(u=>s.push(u)),{mode:t.mode,value:i,pads:s}}else return t},Ih=(e,t)=>{Ol(e.inputs);let r=Pl(e.inputs,t);e.compute(Ul(e.inputs,r),{inputs:[0]})}}),Jt,Yi,Xi,Ji,ea,ql,Wl,ta,ra,Eh,zh,ia,Ch,Ah,aa,Oh,Rh,Bh,Nh,Iy=P(()=>{Pe(),J(),re(),ie(),Jt=e=>{if(we.webgpu.validateInputContent&&(!e||e.length!==1))throw new Error("Pool ops requires 1 input.")},Yi=(e,t,r)=>{let i=t.format==="NHWC",a=e.dims.slice();i&&a.splice(1,0,a.pop());let n=Object.hasOwnProperty.call(t,"dilations"),s=t.kernelShape.slice(),u=t.strides.slice(),d=n?t.dilations.slice():[],p=t.pads.slice();Wr.adjustPoolAttributes(r,a,s,u,d,p);let m=Wr.computePoolOutputShape(r,a,u,d,s,p,t.autoPad),h=Object.assign({},t);n?Object.assign(h,{kernelShape:s,strides:u,pads:p,dilations:d,cacheKey:t.cacheKey}):Object.assign(h,{kernelShape:s,strides:u,pads:p,cacheKey:t.cacheKey});let g=m.slice();return g.push(g.splice(1,1)[0]),[h,i?g:m]},Xi=(e,t)=>{let r=t.format==="NHWC",i=O.size(e),a=O.size(t.kernelShape),n=[{type:12,data:i},{type:12,data:a}],s=[{name:"outputSize",type:"u32"},{name:"kernelSize",type:"u32"}];if(t.kernelShape.length<=2){let u=t.kernelShape[t.kernelShape.length-1],d=t.strides[t.strides.length-1],p=t.pads[t.pads.length/2-1],m=t.pads[t.pads.length-1],h=!!(p+m);n.push({type:12,data:u},{type:12,data:d},{type:12,data:p},{type:12,data:m}),s.push({name:"kw",type:"u32"},{name:"sw",type:"u32"},{name:"pwStart",type:"u32"},{name:"pwEnd",type:"u32"});let g=!1;if(t.kernelShape.length===2){let y=t.kernelShape[t.kernelShape.length-2],_=t.strides[t.strides.length-2],$=t.pads[t.pads.length/2-2],T=t.pads[t.pads.length-2];g=!!($+T),n.push({type:12,data:y},{type:12,data:_},{type:12,data:$},{type:12,data:T}),s.push({name:"kh",type:"u32"},{name:"sh",type:"u32"},{name:"phStart",type:"u32"},{name:"phEnd",type:"u32"})}return[n,s,!0,h,g]}else{if(r)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let u=O.computeStrides(t.kernelShape);n.push({type:12,data:u},{type:12,data:t.pads},{type:12,data:t.strides}),s.push({name:"kernelStrides",type:"u32",length:u.length},{name:"pads",type:"u32",length:t.pads.length},{name:"strides",type:"u32",length:t.strides.length});let d=t.pads.reduce((p,m)=>p+m);return[n,s,!!d,!1,!1]}},Ji=(e,t,r,i,a,n,s,u,d,p,m,h)=>{let g=a.format==="NHWC",y=t.type.value,_=F("output",t.type.tensor,i);if(a.kernelShape.length<=2){let $="",T="",x="",w=r-(g?2:1);if(m?$=`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${w}] = indices[${w}] * uniforms.sw - uniforms.pwStart + i;
                  if (xIndices[${w}] < 0 || xIndices[${w}]
                      >= uniforms.x_shape[${w}]) {
                    pad++;
                    continue;
                  }
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${n}
                }`:$=`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${w}] = indices[${w}] * uniforms.sw - uniforms.pwStart + i;
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${n}
                }`,a.kernelShape.length===2){let I=r-(g?3:2);h?T=`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${I}] = indices[${I}] * uniforms.sh - uniforms.phStart + j;
                  if (xIndices[${I}] < 0 || xIndices[${I}] >= uniforms.x_shape[${I}]) {
                    pad += i32(uniforms.kw);
                    continue;
                  }
              `:T=`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${I}] = indices[${I}] * uniforms.sh - uniforms.phStart + j;
                `,x=`
              }
            `}return`
            ${e.registerUniforms(d).declareVariables(t,_)}

            ${e.mainStart()}
              ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

              let indices = ${_.offsetToIndices("global_idx")};
              var xIndices = ${_.offsetToIndices("global_idx")};

              var value = ${y}(${u});
              var pad = 0;
              ${T}
              ${$}
              ${x}
              ${s}

              output[global_idx] = value;
            }`}else{if(g)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let $=a.kernelShape.length,T=a.pads.length,x="";return p?x=`
                if (xIndices[j] >= uniforms.x_shape[j]) {
                  pad++;
                  isPad = true;
                  break;
                }
              }
              if (!isPad) {
                let x_val = x[${t.indicesToOffset("xIndices")}];
                ${n}
              }`:x=`
              }
              let x_val = x[${t.indicesToOffset("xIndices")}];
              ${n}
            `,`
            ${e.registerUniforms(d).declareVariables(t,_)}

            ${e.mainStart()}
              ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
              let indices = ${_.offsetToIndices("global_idx")};
              var xIndices = ${_.offsetToIndices("global_idx")};

              var offsets: array<u32, ${$}>;

              var value = ${y}(${u});
              var pad = 0;
              var isPad = false;

              for (var i: u32 = 0u; i < uniforms.kernelSize; i++) {
                var offset = i;
                for (var j = 0u; j < ${$-1}u; j++) {
                  offsets[j] = offset / ${j("uniforms.kernelStrides","j",$)};
                  offset -= offsets[j] * ${j("uniforms.kernelStrides","j",$)};
                }
                offsets[${$-1}] = offset;

                isPad = false;
                for (var j = ${r-$}u; j < ${r}u; j++) {
                  xIndices[j] = indices[j] * ${j("uniforms.strides",`j - ${r-$}u`,$)}
                    + offsets[j - ${r-$}u] - ${j("uniforms.pads","j - 2u",T)};
                  ${x}
              }
              ${s}

              output[global_idx] = value;
            }`}},ea=e=>`${e.format};${e.ceilMode};${e.autoPad};${e.kernelShape.length}`,ql=e=>`${ea(e)};${e.countIncludePad}`,Wl=e=>`${ea(e)};${e.storageOrder};${e.dilations}`,ta=e=>({format:e.format,autoPad:["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],ceilMode:e.ceil_mode,kernelShape:e.kernel_shape,strides:e.strides,pads:e.pads}),ra=(e,t,r,i)=>{let[a,n]=Yi(t,i,r),s=N("x",t.dataType,t.dims.length),u=s.type.value,d="value += x_val;",p="";a.countIncludePad?p+=`value /= ${u}(uniforms.kernelSize);`:p+=`value /= ${u}(i32(uniforms.kernelSize) - pad);`;let[m,h,g,y,_]=Xi(n,a);m.push(...K(t.dims,n));let $=["rank"];return{name:e,shaderCache:{hint:`${i.cacheKey};${g};${y};${_}`,inputDependencies:$},getRunData:()=>({outputs:[{dims:n,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(O.size(n)/64)},programUniforms:m}),getShaderSource:T=>Ji(T,s,t.dims.length,n.length,a,d,p,0,h,g,y,_)}},Eh=e=>{let t=e.count_include_pad!==0,r=ta(e);if(r.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for AveragePool");let i={countIncludePad:t,...r,cacheKey:""};return{...i,cacheKey:ql(i)}},zh=(e,t)=>{Jt(e.inputs),e.compute(ra("AveragePool",e.inputs[0],!1,t))},ia={autoPad:"",ceilMode:0,countIncludePad:!1,kernelShape:[],strides:[],pads:[],storageOrder:0,dilations:[]},Ch=e=>{let t=e.format;return{format:t,...ia,cacheKey:t}},Ah=(e,t)=>{Jt(e.inputs),e.compute(ra("GlobalAveragePool",e.inputs[0],!0,t))},aa=(e,t,r,i)=>{let[a,n]=Yi(t,i,r),s=`
      value = max(x_val, value);
    `,u="",d=N("x",t.dataType,t.dims.length),p=["rank"],[m,h,g,y,_]=Xi(n,a);return m.push(...K(t.dims,n)),{name:e,shaderCache:{hint:`${i.cacheKey};${g};${y};${_}`,inputDependencies:p},getRunData:()=>({outputs:[{dims:n,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(O.size(n)/64)},programUniforms:m}),getShaderSource:$=>Ji($,d,t.dims.length,n.length,a,s,u,t.dataType===10?-65504:-1e5,h,g,y,_)}},Oh=(e,t)=>{Jt(e.inputs),e.compute(aa("MaxPool",e.inputs[0],!1,t))},Rh=e=>{let t=e.storage_order,r=e.dilations,i=ta(e);if(t!==0)throw new Error("column major storage order is not yet supported for MaxPool");if(i.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for MaxPool");let a={storageOrder:t,dilations:r,...i,cacheKey:""};return{...a,cacheKey:Wl(a)}},Bh=e=>{let t=e.format;return{format:t,...ia,cacheKey:t}},Nh=(e,t)=>{Jt(e.inputs),e.compute(aa("GlobalMaxPool",e.inputs[0],!0,t))}}),Ll,Vl,Mh,Dh,Ey=P(()=>{J(),re(),ve(),ie(),Ll=(e,t)=>{if(e.length<2||e.length>3)throw new Error("DequantizeLinear requires 2 or 3 inputs.");if(e.length===3&&e[1].dims===e[2].dims)throw new Error("x-scale and x-zero-point must have the same shape.");if(e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[0].dataType===6&&e.length>2)throw new Error("In the case of dequantizing int32 there is no zero point.");if(e[1].dims.length!==0&&e[1].dims.length!==1&&e[1].dims.length!==e[0].dims.length)throw new Error("scale input must be a scalar, a 1D tensor, or have the same rank as the input tensor.");if(e.length>2){if(e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[1].dims.length!==e[2].dims.length)throw new Error("scale and zero-point inputs must have the same rank.");if(!e[1].dims.map((r,i)=>r===e[2].dims[i]).reduce((r,i)=>r&&i,!0))throw new Error("scale and zero-point inputs must have the same shape.")}if(t.blockSize>0){if(e[1].dims.length===0||e[1].dims.length===1&&e[1].dims[0]===1)throw new Error("blockSize must be set only for block quantization.");if(!e[1].dims.map((a,n)=>n===t.axis||a===e[0].dims[n]).reduce((a,n)=>a&&n,!0))throw new Error("For block qunatization, scale input shape to match the input shape except for the axis");if(e[1].dims.length!==e[0].dims.length)throw new Error("For block qunatization the scale input rank must be the same as the x rank.");let r=e[0].dims[t.axis],i=e[1].dims[t.axis];if(t.blockSize<Math.ceil(r/i)||t.blockSize>Math.ceil(r/(i-1)-1))throw new Error("blockSize must be with in the range [ceil(dI / Si), ceil(dI / (Si - 1) - 1)].")}},Vl=(e,t)=>{let r=O.normalizeAxis(t.axis,e[0].dims.length),i=e[0].dataType,a=i===3,n=e[0].dims,s=e[1].dataType,u=O.size(n),d=i===3||i===2,p=d?[Math.ceil(O.size(e[0].dims)/4)]:e[0].dims,m=e[1].dims,h=e.length>2?e[2]:void 0,g=h?d?[Math.ceil(O.size(h.dims)/4)]:h.dims:void 0,y=m.length===0||m.length===1&&m[0]===1,_=y===!1&&m.length===1,$=$e(u),T=y&&(!d||$===4),x=T?$:1,w=T&&!d?$:1,I=N("input",d?12:i,p.length,w),S=N("scale",s,m.length),E=h?N("zero_point",d?12:i,g.length):void 0,C=F("output",s,n.length,x),A=[I,S];E&&A.push(E);let v=[p,m];h&&v.push(g);let U=[{type:12,data:u/x},{type:12,data:r},{type:12,data:t.blockSize},...K(...v,n)],q=Y=>{let H=[{name:"output_size",type:"u32"},{name:"axis",type:"u32"},{name:"block_size",type:"u32"}];return`
      ${Y.registerUniforms(H).declareVariables(...A,C)}
      ${Y.mainStart()}
          ${Y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let output_indices = ${C.offsetToIndices("global_idx")};

          // Set input x
          ${d?`
            let input = ${I.getByOffset("global_idx / 4")};
            let x_vec = ${a?"unpack4xI8(input)":"unpack4xU8(input)"};
            let x_value = ${x===1?"x_vec[global_idx % 4]":"x_vec"};`:`let x_value = ${I.getByOffset("global_idx")};`};

          // Set scale input
          ${y?`let scale_value= ${S.getByOffset("0")}`:_?`
            let scale_index = ${C.indicesGet("output_indices","uniforms.axis")};
            let scale_value= ${S.getByOffset("scale_index")};`:`
            var scale_indices: ${S.type.indices} = output_indices;
            let index = ${S.indicesGet("scale_indices","uniforms.axis")} / uniforms.block_size;
            ${S.indicesSet("scale_indices","uniforms.axis","index")};
            let scale_value= ${S.getByIndices("scale_indices")};`};

          // Set zero-point input
          ${E?y?d?`
                let zero_point_input = ${E.getByOffset("0")};
                let zero_point_vec =  ${a?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value= zero_point_vec[0]`:`let zero_point_value = ${E.getByOffset("0")}`:_?d?`
                let zero_point_index = ${C.indicesGet("output_indices","uniforms.axis")};
                let zero_point_input = ${E.getByOffset("zero_point_index / 4")};
                let zero_point_vec =  ${a?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_index % 4]`:`
                let zero_point_index = ${C.indicesGet("output_indices","uniforms.axis")};
                let zero_point_value = ${E.getByOffset("zero_point_index")};`:d?`
                let zero_point_offset = ${S.indicesToOffset("scale_indices")};
                let zero_point_input = ${E.getByOffset("zero_point_offset / 4")};
                let zero_point_vec = ${a?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_offset % 4];`:`let zero_point_value = ${E.getByIndices("scale_indices")};`:`let zero_point_value = ${d?a?"i32":"u32":I.type.value}(0);`};
      // Compute and write output
      ${C.setByOffset("global_idx",`${C.type.value}(x_value - zero_point_value) * scale_value`)};
      }`};return{name:"DequantizeLinear",shaderCache:{hint:t.cacheKey,inputDependencies:E?["rank","rank","rank"]:["rank","rank"]},getShaderSource:q,getRunData:()=>({outputs:[{dims:n,dataType:s}],dispatchGroup:{x:Math.ceil(u/x/64),y:1,z:1},programUniforms:U})}},Mh=(e,t)=>{Ll(e.inputs,t),e.compute(Vl(e.inputs,t))},Dh=e=>he({axis:e.axis,blockSize:e.blockSize})}),Gl,Hl,Uh,zy=P(()=>{Pe(),J(),ie(),Gl=(e,t,r)=>{let i=e===t,a=e<t&&r<0,n=e>t&&r>0;if(i||a||n)throw new Error("Range these inputs' contents are invalid.")},Hl=(e,t,r,i)=>{let a=Math.abs(Math.ceil((t-e)/r)),n=[a],s=a,u=[{type:12,data:s},{type:i,data:e},{type:i,data:r},...K(n)],d=p=>{let m=F("output",i,n.length),h=m.type.value,g=[{name:"outputSize",type:"u32"},{name:"start",type:h},{name:"delta",type:h}];return`
        ${p.registerUniforms(g).declareVariables(m)}
        ${p.mainStart()}
        ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        output[global_idx] = uniforms.start + ${h}(global_idx) * uniforms.delta;
      }`};return{name:"Range",shaderCache:{hint:`${i}`},getShaderSource:d,getRunData:()=>({outputs:[{dims:n,dataType:i}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:u})}},Uh=e=>{let t=0,r=0,i=0;e.inputs[0].dataType===6?(t=e.inputs[0].getInt32Array()[0],r=e.inputs[1].getInt32Array()[0],i=e.inputs[2].getInt32Array()[0]):e.inputs[0].dataType===1&&(t=e.inputs[0].getFloat32Array()[0],r=e.inputs[1].getFloat32Array()[0],i=e.inputs[2].getFloat32Array()[0]),we.webgpu.validateInputContent&&Gl(t,r,i),e.compute(Hl(t,r,i,e.inputs[0].dataType),{inputs:[]})}}),Fl,jl,Ph,qh,Cy=P(()=>{J(),re(),ve(),ie(),Fl=(e,t,r,i)=>{if(e!=="none"&&i!=="i32"&&i!=="u32"&&i!=="f32")throw new Error(`Input ${i} is not supported with reduction ${e}.`);let a=`{
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
              }`;switch(e){case"none":return`${t}=${r};`;case"add":return i==="i32"||i==="u32"?`atomicAdd(&${t}, bitcast<${i}>(${r}));`:`
              ${a}bitcast<${i}>(oldValue) + (${r})${n}`;case"max":return i==="i32"||i==="u32"?`atomicMax(&${t}, bitcast<${i}>(${r}));`:`
                ${a}max(bitcast<f32>(oldValue), (${r}))${n}`;case"min":return i==="i32"||i==="u32"?`atomicMin(&${t}, bitcast<${i}>(${r}));`:`${a}min(bitcast<${i}>(oldValue), (${r}))${n}`;case"mul":return`${a}(bitcast<${i}>(oldValue) * (${r}))${n}`;default:throw new Error(`Reduction ${e} is not supported.`)}},jl=(e,t)=>{let r=e[0].dims,i=e[1].dims,a=r,n=1,s=Math.ceil(O.sizeToDimension(i,i.length-1)/n),u=i[i.length-1],d=O.sizeFromDimension(r,u),p=[{type:12,data:s},{type:12,data:u},{type:12,data:d},...K(e[1].dims,e[2].dims,a)],m=h=>{let g=N("indices",e[1].dataType,e[1].dims.length),y=N("updates",e[2].dataType,e[2].dims.length,n),_=t.reduction!=="none"&&t.reduction!==""?fp("output",e[0].dataType,a.length):F("output",e[0].dataType,a.length,n);return`
      ${h.registerUniform("output_size","u32").registerUniform("last_index_dimension","u32").registerUniform("num_updates_elements","u32").declareVariables(g,y,_)}
      ${h.mainStart()}
        ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
  var data_offset = 0u;
  let indices_start = uniforms.last_index_dimension * global_idx;
  let indices_end = indices_start + uniforms.last_index_dimension;
  for (var i = indices_start; i < indices_end; i++) {
    var index = i32(indices[i].x);
    ${e[0].dims.length===1?`
    let element_count_dim = uniforms.output_strides;
    let dim_value = uniforms.output_shape;`:`
    let element_count_dim = uniforms.output_strides[i - indices_start];
    let dim_value = uniforms.output_shape[i - indices_start];`}
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
    data_offset += u32((u32(index) * element_count_dim));
  }

  for (var i = 0u; i < uniforms.num_updates_elements; i++) {
    let value = updates[uniforms.num_updates_elements * global_idx + i];
    ${Fl(t.reduction,"output[data_offset + i]","value",_.type.value)}
  }

      }`};return{name:"ScatterND",shaderCache:{hint:`${t.cacheKey}_${t.reduction}`,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:a,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:p}),getShaderSource:m}},Ph=e=>he({reduction:e.reduction}),qh=(e,t)=>{e.compute(jl(e.inputs,t),{inputs:[e.inputs[1],e.inputs[2]],outputs:[]})}}),Kl,Ql,Zl,na,Yl,Xl,Jl,ed,td,rd,id,ad,sa,nd,sd,od,ud,ld,Wh,Lh,Ay=P(()=>{J(),re(),ve(),ie(),Kl=(e,t)=>{if(e.every(r=>r>0||(()=>{throw new Error("Resize requires scales input values to be positive")})),e.length>0){if(t.mode==="linear"){if(!(e.length===2||e.length===3||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1||e.length===5&&e[0]===1&&e[1]===1))throw new Error(`For linear mode, Resize requires scales to be 2D, 3D, 4D with either two outermost or one innermost and
            one outermost scale values equal to 1, or 5D with two outermost scale values equal to 1`)}else if(t.mode==="cubic"&&!(e.length===2||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1))throw new Error("Resize requires scales input size to be 2 or 4 for cubic mode")}},Ql=(e,t,r)=>{t.every(a=>a>=0&&a<r||(()=>{throw new Error("Resize requires axes input values to be positive and less than rank")}));let i=new Array(r).fill(1);return t.forEach((a,n)=>i[a]=e[n]),i},Zl=(e,t,r,i,a,n)=>{let[s,u,d]=r>10?[1,2,3]:[-1,e.length>1?1:-1,-1],p=e[0].dims.length;if(s>0&&e.length>s&&e[s].dims.length>0)e[s].getFloat32Array().forEach(m=>n.push(m));else if(t.coordinateTransformMode==="tf_crop_and_resize")throw new Error("Resize requires RoI input to be specified when coordinateTransformMode is tfCropAndResize");if(u>0&&e.length>u&&e[u].dims.length===1&&e[u].dims[0]>0){if(e[u].getFloat32Array().forEach(m=>i.push(m)),i.length!==0&&i.length!==p&&r>=18&&i.length!==t.axes.length)throw new Error("Resize requires scales input size to be same as input rank or axes size for opset 18 and up");Kl(i,t),t.axes.length>0&&Ql(i,t.axes,p).forEach((m,h)=>i[h]=m)}if(d>0&&e.length>d&&e[d].dims.length===1&&e[d].dims[0]>0&&(e[d].getBigInt64Array().forEach(m=>a.push(Number(m))),a.length!==0&&a.length!==p&&r>=18&&a.length!==t.axes.length))throw new Error("Resize requires sizes input size to be same as input rank or axes size for opset 18 and up");if(t.axes.length>0){if(i.length!==0&&i.length!==t.axes.length)throw new Error('Resize requires "scales" input size to be of axes rank when axes attributes is specified');if(a.length!==0&&a.length!==t.axes.length)throw new Error('Resize requires "sizes" input size to be of rank axes rank when axes attributes is specified')}if(typeof i<"u"&&typeof a<"u"&&i.length>0&&a.length>p)throw new Error("Resize requires only of scales or sizes to be specified")},na=(e,t,r,i)=>`
  // The whole part and the fractional part are calculated separately due to inaccuracy of floating
  // point division. As an example, f32(21) / f32(7) may evaluate to 2.99... instead of 3, causing an
  // offset-by-one error later in floor().
  let big = (${e}) * (${t});
  let whole = ${i}(big / (${r}));
  let fract = ${i}(big % (${r})) / ${i}(${r});
  return whole + fract;
`,Yl=(e,t)=>`fn getOriginalCoordinateFromResizedCoordinate(xResized: u32, xScale: f32, lengthResized: u32,
     lengthOriginal: u32, roiStart: f32, roiEnd: f32) -> ${t} { `+(()=>{switch(e){case"asymmetric":return`
          if (xScale < 1.0 || floor(xScale) != xScale) {
            return ${t}(xResized) / ${t}(xScale);
          } else {
            ${na("xResized","lengthOriginal","lengthResized",t)}
          }
        `;case"pytorch_half_pixel":return`if (lengthResized > 1) {
                    return (${t}(xResized) + 0.5) / ${t}(xScale) - 0.5;
                  } else {
                    return 0.0;
                  }`;case"tf_half_pixel_for_nn":return`return (${t}(xResized) + 0.5) / ${t}(xScale);`;case"align_corners":return`if (lengthResized == 1) {
                    return 0.0;
                  } else {
                    ${na("xResized","lengthOriginal - 1","lengthResized - 1",t)}
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
                  return offset + ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;case"half_pixel":return`return ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;default:throw new Error(`Coordinate transform mode ${e} is not supported`)}})()+"}",Xl=(e,t,r)=>`fn getNearestPixelFromOriginal(xOriginal: ${r}, isDownSample: bool) -> ${r} {`+(()=>{switch(e){case"round_prefer_ceil":return"if (fract(xOriginal) == 0.5) {             return ceil(xOriginal);           } else {             return round(xOriginal);           }";case"floor":return"return floor(xOriginal);";case"ceil":return"return ceil(xOriginal);";case"round_prefer_floor":return"if (fract(xOriginal) == 0.5) {                     return floor(xOriginal);                   } else {                     return round(xOriginal);                   }";default:if(t<11)return"if (isDownSample)                     {                       return ceil(xOriginal);                     } else {                       return xOriginal;                     }";throw new Error(`Nearest mode ${e} is not supported`)}})()+"}",Jl=(e,t,r)=>{let i=new Array(r).fill(0).concat(new Array(r).fill(1)),a=e.length===0?i:e.slice();return t.length>0?(t.forEach((n,s)=>{i[n]=a[s],i[s+r]=a[t.length+s]}),i):a},ed=(e,t,r,i)=>{let a=[];if(r.length>0)if(i.length>0){if(e.forEach(n=>a.push(n)),Math.max(...i)>e.length)throw new Error("axes is out of bound");i.forEach((n,s)=>a[n]=r[s])}else r.forEach(n=>a.push(n));else{if(t.length===0)throw new Error("Resize requires either scales or sizes.");a=e.map((n,s)=>Math.round(n*t[s]))}return a},td=(e,t,r)=>{let i=(()=>{switch(r.keepAspectRatioPolicy){case"not_larger":return r.axes.length>0?Math.min(...r.axes.map(n=>t[n]),Number.MAX_VALUE):Math.min(...t,Number.MAX_VALUE);case"not_smaller":return r.axes.length>0?Math.max(...r.axes.map(n=>t[n]),Number.MIN_VALUE):Math.max(...t,Number.MIN_VALUE);default:throw new Error(`Keep aspect ratio policy ${r.keepAspectRatioPolicy} is not supported`)}})();t.fill(1,0,t.length);let a=e.slice();return r.axes.length>0?(r.axes.forEach(n=>t[n]=i),r.axes.forEach(n=>a[n]=Math.round(e[n]*t[n]))):(t.fill(i,0,t.length),a.forEach((n,s)=>a[s]=Math.round(n*t[s]))),a},rd=(e,t,r,i,a)=>`
    fn calculateOriginalIndicesFromOutputIndices(output_indices: ${e.type.indices}) -> array<${e.type.value}, ${r.length}> {
      var original_indices: array<${e.type.value}, ${r.length}>;
      for (var i:u32 = 0; i < ${r.length}; i++) {
        var output_index = ${e.indicesGet("output_indices","i")};
        var scale = ${j("uniforms.scales","i",i)};
        var roi_low = ${j("uniforms.roi","i",a)};
        var roi_hi = ${j("uniforms.roi",`i + ${t.length}`,a)};
        if (scale == 1.0) {
          original_indices[i] = ${e.type.value}(output_index);
        } else {
          var input_shape_i = ${j("uniforms.input_shape","i",t.length)};
          var output_shape_i = ${j("uniforms.output_shape","i",r.length)};
          original_indices[i] = getOriginalCoordinateFromResizedCoordinate(output_index, scale, output_shape_i,
                                                                           input_shape_i, roi_low, roi_hi);
        }
      }
      return original_indices;
    }`,id=(e,t,r,i,a,n,s)=>`
    fn calculateInputIndicesFromOutputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
      var input_indices: ${e.type.indices};
      for (var i:u32 = 0; i < ${i.length}; i++) {
        var output_index = ${t.indicesGet("output_indices","i")};
        var input_index: u32;
        var scale = ${j("uniforms.scales","i",a)};
        if (scale == 1.0) {
          input_index = output_index;
        } else {
          var roi_low = ${j("uniforms.roi","i",n)};
          var roi_hi = ${j("uniforms.roi",`i + ${r.length}`,n)};
          var input_shape_i = ${j("uniforms.input_shape","i",r.length)};
          var output_shape_i = ${j("uniforms.output_shape","i",i.length)};
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
    }`,ad=(e,t)=>`
    fn checkInputIndices(input_indices: ${e.type.indices}) -> bool {
      for (var i:u32 = 0; i < ${t.length}; i++) {
        var input_index = ${e.indicesGet("input_indices","i")};
        if (input_index < 0 || input_index >= ${j("uniforms.input_shape","i",t.length)}) {
          return false;
        }
      }
      return true;
    }`,sa=(e,t,r,i)=>e.rank>i?`
    ${e.indicesSet("input_indices",t,"channel")};
    ${e.indicesSet("input_indices",r,"batch")};
`:"",nd=(e,t,r,i,a)=>{let[n,s,u,d]=r.length===2?[-1,0,1,-1]:[0,2,3,1],p=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, row: u32, col: u32) -> ${p} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",s,`max(0, min(row, ${r[s]} - 1))`)};
      ${e.indicesSet("input_indices",u,`max(0, min(col, ${r[u]} - 1))`)};
      ${sa(e,d,n,2)}
      return ${e.getByIndices("input_indices")};
    }

    fn bilinearInterpolation(output_indices: ${t.type.indices}) -> ${p} {
      var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
      var row:${p} = originalIndices[${s}];
      var col:${p} = originalIndices[${u}];
      ${i?`if (row < 0 || row > (${r[s]} - 1) || col < 0 || col > (${r[u]} - 1)) {
        return ${a};
      }`:""};
      row = max(0, min(row, ${r[s]} - 1));
      col = max(0, min(col, ${r[u]} - 1));
      var row1: u32 = u32(row);
      var col1: u32 = u32(col);
      var row2: u32 = u32(row + 1);
      var col2: u32 = u32(col + 1);
      var channel: u32 = ${r.length>2?`u32(originalIndices[${d}])`:"0"};
      var batch: u32 =  ${r.length>2?`u32(originalIndices[${n}])`:"0"};
      var x11: ${p} = getInputValue(batch, channel, row1, col1);
      var x12: ${p} = getInputValue(batch, channel, row1, col2);
      var x21: ${p} = getInputValue(batch, channel, row2, col1);
      var x22: ${p} = getInputValue(batch, channel, row2, col2);
      var dx1: ${p} = abs(row - ${p}(row1));
      var dx2: ${p} = abs(${p}(row2) - row);
      var dy1: ${p} = abs(col - ${p}(col1));
      var dy2: ${p} = abs(${p}(col2) - col);
      if (row1 == row2) {
        dx1 = 0.5;
        dx2 = 0.5;
      }
      if (col1 == col2) {
        dy1 = 0.5;
        dy2 = 0.5;
      }
      return (x11 * dx2 * dy2 + x12 * dx2 * dy1 + x21 * dx1 * dy2 + x22 * dx1 * dy1);
    }`},sd=(e,t,r,i,a,n,s,u,d,p)=>{let m=r.length===2,[h,g]=m?[0,1]:[2,3],y=e.type.value,_=$=>{let T=$===h?"row":"col";return`
      fn ${T}CubicInterpolation(input_indices: ${e.type.indices}, output_indices: ${t.type.indices}) -> ${y} {
        var output_index = ${t.indicesGet("output_indices",$)};
        var originalIdx: ${y} = getOriginalCoordinateFromResizedCoordinate(output_index, ${a[$]},
        ${i[$]}, ${r[$]}, ${n[$]}, ${n[$]} + ${r.length});
        var fractOriginalIdx: ${y} = originalIdx - floor(originalIdx);
        var coefs = getCubicInterpolationCoefs(fractOriginalIdx);

        if (${u} && (originalIdx < 0 || originalIdx > (${r[$]} - 1))) {
          return ${d};
        }
        var data: array<${y}, 4> = array<${y}, 4>(0.0, 0.0, 0.0, 0.0);
        for (var i: i32 = -1; i < 3; i++) {
          var ${T}: ${y} = originalIdx + ${y}(i);
          if (${T} < 0 || ${T} >= ${r[$]}) {
            ${p?`coefs[i + 1] = 0.0;
                        continue;`:u?`return ${d};`:`${T} = max(0, min(${T}, ${r[$]} - 1));`};
          }
        var input_indices_copy: ${e.type.indices} = input_indices;
          ${e.indicesSet("input_indices_copy",$,`u32(${T})`)};
          data[i + 1] = ${$===h?e.getByIndices("input_indices_copy"):"rowCubicInterpolation(input_indices_copy, output_indices)"};
        }
        return cubicInterpolation1D(data, coefs);
      }`};return`
    ${_(h)};
    ${_(g)};
  fn getCubicInterpolationCoefs(s: ${y}) -> array<${y}, 4> {
    var absS = abs(s);
    var coeffs: array<${y}, 4> = array<${y}, 4>(0.0, 0.0, 0.0, 0.0);
    var oneMinusAbsS: ${y} = 1.0 - absS;
    var twoMinusAbsS: ${y} = 2.0 - absS;
    var onePlusAbsS: ${y} = 1.0 + absS;
    coeffs[0] = ((${s} * onePlusAbsS - 5 * ${s}) * onePlusAbsS + 8 * ${s}) * onePlusAbsS - 4 * ${s};
    coeffs[1] = ((${s} + 2) * absS - (${s} + 3)) * absS * absS + 1;
    coeffs[2] = ((${s} + 2) * oneMinusAbsS - (${s} + 3)) * oneMinusAbsS * oneMinusAbsS + 1;
    coeffs[3] = ((${s} * twoMinusAbsS - 5 * ${s}) * twoMinusAbsS + 8 * ${s}) * twoMinusAbsS - 4 * ${s};
    return coeffs;
  }

  fn cubicInterpolation1D(x: array<${y}, 4>, coefs: array<${y}, 4>) -> ${y} {
    var coefsSum: ${y} = coefs[0] + coefs[1] + coefs[2] + coefs[3];
    return (x[0] * coefs[0] + x[1] * coefs[1]+ x[2] * coefs[2]+ x[3] * coefs[3]) / coefsSum;
  }

  fn bicubicInterpolation(output_indices: ${t.type.indices}) -> ${y} {
    var input_indices: ${e.type.indices} = output_indices;
    return colCubicInterpolation(input_indices, output_indices);
  }
    `},od=(e,t,r,i,a)=>{let[n,s,u,d,p]=r.length===3?[-1,0,1,2,-1]:[0,2,3,4,1],m=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, depth:u32, height: u32, width: u32) -> ${m} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",s,`max(0, min(depth, ${r[s]} - 1))`)};
      ${e.indicesSet("input_indices",u,`max(0, min(height, ${r[u]} - 1))`)};
      ${e.indicesSet("input_indices",d,`max(0, min(width, ${r[d]} - 1))`)};
      ${sa(e,p,n,3)}
      return ${e.getByIndices("input_indices")};
    }

    fn trilinearInterpolation(output_indices: ${t.type.indices}) -> ${m} {
      var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
      var depth:${m} = originalIndices[${s}];
      var height:${m} = originalIndices[${u}];
      var width:${m} = originalIndices[${d}];
      ${i?`if (depth < 0 || depth > (${r[s]} - 1) || height < 0 || height > (${r[u]} - 1) || width < 0 || (width > ${r[d]} - 1)) {
      return ${a};
        }`:""};

    depth = max(0, min(depth, ${r[s]} - 1));
      height = max(0, min(height, ${r[u]} - 1));
      width = max(0, min(width, ${r[d]} - 1));
      var depth1: u32 = u32(depth);
      var height1: u32 = u32(height);
      var width1: u32 = u32(width);
      var depth2: u32 = u32(depth + 1);
      var height2: u32 = u32(height + 1);
      var width2: u32 = u32(width + 1);
      var channel: u32 = ${r.length>3?`u32(originalIndices[${p}])`:"0"};
      var batch: u32 =  ${r.length>3?`u32(originalIndices[${n}])`:"0"};

      var x111: ${m} = getInputValue(batch, channel, depth1, height1, width1);
      var x112: ${m} = getInputValue(batch, channel, depth1, height1, width2);
      var x121: ${m} = getInputValue(batch, channel, depth1, height2, width1);
      var x122: ${m} = getInputValue(batch, channel, depth1, height2, width2);
      var x211: ${m} = getInputValue(batch, channel, depth2, height1, width1);
      var x212: ${m} = getInputValue(batch, channel, depth2, height1, width2);
      var x221: ${m} = getInputValue(batch, channel, depth2, height2, width1);
      var x222: ${m} = getInputValue(batch, channel, depth2, height2, width2);
      var dx1: ${m} = abs(depth - ${m}(depth1));
      var dx2: ${m} = abs(${m}(depth2) - depth);
      var dy1: ${m} = abs(height - ${m}(height1));
      var dy2: ${m} = abs(${m}(height2) - height);
      var dz1: ${m} = abs(width - ${m}(width1));
      var dz2: ${m} = abs(${m}(width2) - width);
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
    }`},ud=(e,t,r,i,a,n)=>{let s=e.dims,u=Jl(n,t.axes,s.length),d=ed(s,i,a,t.axes),p=i.slice();i.length===0&&(p=s.map((w,I)=>w===0?1:d[I]/w),t.keepAspectRatioPolicy!=="stretch"&&(d=td(s,p,t)));let m=F("output",e.dataType,d.length),h=N("input",e.dataType,s.length),g=O.size(d),y=s.length===d.length&&s.every((w,I)=>w===d[I]),_=t.coordinateTransformMode==="tf_crop_and_resize",$=t.extrapolationValue,T=h.type.value,x=w=>`
      ${y?"":`
      ${Yl(t.coordinateTransformMode,T)};
      ${(()=>{switch(t.mode){case"nearest":return`
              ${ad(h,s)};
              ${Xl(t.nearestMode,r,T)};
              ${id(h,m,s,d,p.length,u.length,_)};
              `;case"linear":return`
              ${rd(m,s,d,p.length,u.length)};
              ${(()=>{if(s.length===2||s.length===4)return`${nd(h,m,s,_,$)}`;if(s.length===3||s.length===5)return`${od(h,m,s,_,$)}`;throw Error("Linear mode only supports input dims 2, 3, 4 and 5 are supported in linear mode.")})()};
            `;case"cubic":return`
            ${(()=>{if(s.length===2||s.length===4)return`${sd(h,m,s,d,p,u,t.cubicCoeffA,_,t.extrapolationValue,t.excludeOutside)}`;throw Error("Cubic mode only supports input dims 2 and 4 are supported in linear mode.")})()};
            `;default:throw Error("Invalid resize mode")}})()};
      `}
      ${w.registerUniform("output_size","u32").registerUniform("scales","f32",p.length).registerUniform("roi","f32",u.length).declareVariables(h,m)}
      ${w.mainStart()}
        ${w.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
        ${y?"output[global_idx] = input[global_idx];":`
        let output_indices = ${m.offsetToIndices("global_idx")};
        var input_indices: ${h.type.indices};
        ${(()=>{switch(t.mode){case"nearest":return`input_indices = calculateInputIndicesFromOutputIndices(output_indices);
                if (checkInputIndices(input_indices)) {
                  output[global_idx] = ${h.getByIndices("input_indices")};
                } else {
                  output[global_idx] = ${t.extrapolationValue};
                }`;case"linear":return`output[global_idx] = ${s.length===2||s.length===4?"bilinearInterpolation":"trilinearInterpolation"}(output_indices);`;case"cubic":return"output[global_idx] = bicubicInterpolation(output_indices);";default:throw Error(`Unsupported resize mode: ${t.mode}`)}})()};
`}
      }`;return{name:"Resize",shaderCache:{hint:`${t.cacheKey}|${r}|${p.length>0?t.mode==="cubic"?p:p.length:""}|${a.length>0?a:""}|${u.length>0?u:""}|${y}|${t.mode==="nearest"?s.length:s}`,inputDependencies:["rank"]},getShaderSource:x,getRunData:()=>({outputs:[{dims:d,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(g/64)},programUniforms:[{type:12,data:g},{type:1,data:p},{type:1,data:u},...K(s,d)]})}},ld=e=>{let t=e.customDataBuffer;return new Uint32Array(t,t.byteOffset,1)[0]},Wh=(e,t)=>{let r=[],i=[],a=[],n=ld(e);if(t.antialias!==0)throw Error("Only default value (0) for Antialias attribute is supported");Zl(e.inputs,t,n,r,i,a),e.compute(ud(e.inputs[0],t,n,r,i,a),{inputs:[0]})},Lh=e=>{let t=e.antialias,r=e.axes,i=e.coordinateTransformMode,a=e.cubicCoeffA,n=e.excludeOutside!==0,s=e.extrapolationValue,u=e.keepAspectRatioPolicy,d=e.mode,p=e.nearestMode===""?"simple":e.nearestMode;return he({antialias:t,axes:r,coordinateTransformMode:i,cubicCoeffA:a,excludeOutside:n,extrapolationValue:s,keepAspectRatioPolicy:u,mode:d,nearestMode:p})}}),dd,pd,Vh,Oy=P(()=>{J(),re(),ie(),dd=e=>{if(!e||e.length<3)throw new Error("layerNorm requires at least 3 inputs.");let t=e[0],r=e[1],i=e[2];if(t.dataType!==r.dataType||t.dataType!==i.dataType)throw new Error("All inputs must have the same data type");if(t.dims.length!==3&&t.dims.length!==2)throw new Error("Input must be 2D or 3D");if(r.dims.length!==3&&r.dims.length!==2)throw new Error("Skip must be 2D or 3D");let a=t.dims[t.dims.length-1],n=t.dims[t.dims.length-2];if(r.dims[r.dims.length-1]!==a)throw new Error("Skip must have the same hidden size as input");if(r.dims[r.dims.length-2]!==n)throw new Error("Skip must have the same sequence length as input");if(i.dims.length!==1)throw new Error("Gamma must be 1D");if(i.dims[i.dims.length-1]!==a)throw new Error("Gamma must have the same hidden size as input");if(e.length>3){let s=e[3];if(s.dims.length!==1)throw new Error("Beta must be 1D");if(s.dims[s.dims.length-1]!==a)throw new Error("Beta must have the same hidden size as input")}if(e.length>4){let s=e[4];if(s.dims.length!==1)throw new Error("Bias must be 1D");if(s.dims[s.dims.length-1]!==a)throw new Error("Bias must have the same hidden size as input")}},pd=(e,t,r,i)=>{let a=t.simplified,n=e[0].dims,s=O.size(n),u=n,d=s,p=n.slice(-1)[0],m=i?n.slice(0,-1).concat(1):[],h=!a&&e.length>3,g=e.length>4,y=i&&r>1,_=i&&r>2,$=r>3,T=64,x=$e(p),w=[{type:12,data:d},{type:12,data:x},{type:12,data:p},{type:1,data:t.epsilon}],I=E=>{let C=[{name:"output_size",type:"u32"},{name:"components",type:"u32"},{name:"hidden_size",type:"u32"},{name:"epsilon",type:"f32"}],A=[N("x",e[0].dataType,e[0].dims,x),N("skip",e[1].dataType,e[1].dims,x),N("gamma",e[2].dataType,e[2].dims,x)];h&&A.push(N("beta",e[3].dataType,e[3].dims,x)),g&&A.push(N("bias",e[4].dataType,e[4].dims,x)),A.push(F("output",e[0].dataType,u,x)),y&&A.push(F("mean_output",1,m)),_&&A.push(F("inv_std_output",1,m)),$&&A.push(F("input_skip_bias_sum",e[0].dataType,u,x));let v=Te(e[0].dataType),U=Te(1,x);return`

      ${E.registerUniforms(C).declareVariables(...A)}
      var<workgroup> sum_shared : array<${U}, ${T}>;
      var<workgroup> sum_squared_shared : array<${U}, ${T}>;

      ${E.mainStart([T,1,1])}
        let ix = local_id.x;
        let iy = global_id.x / ${T};

        let hidden_size_vectorized: u32 = uniforms.hidden_size / uniforms.components;
        var stride = hidden_size_vectorized / ${T};
        let offset = ix * stride + iy * hidden_size_vectorized;
        let offset1d = stride * ix;
        if (ix == ${T-1}) {
          stride = hidden_size_vectorized - stride * ix;
        }
        for (var i: u32 = 0; i < stride; i++) {
          let skip_value = skip[offset + i];
          let bias_value = ${g?"bias[offset1d + i]":v+"(0.0)"};
          let input_value = x[offset + i];
          let value = input_value + skip_value + bias_value;
          ${$?"input_skip_bias_sum[offset + i] = value;":""}
          output[offset + i] = value;
          let f32_value = ${Ut(v,x,"value")};
          sum_shared[ix] += f32_value;
          sum_squared_shared[ix] += f32_value * f32_value;
        }
        workgroupBarrier();

        var reduce_size : u32 = ${T};
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
        let mean = ${mt("sum",x)} / f32(uniforms.hidden_size);
        let inv_std_dev = inverseSqrt(${mt("square_sum",x)} / f32(uniforms.hidden_size) ${a?"":"- mean * mean"} + uniforms.epsilon);
        ${y?"mean_output[global_idx] = mean;":""}
        ${_?"inv_std_output[global_idx] = inv_std_dev;":""}

        for (var i: u32 = 0; i < stride; i++) {
          output[offset + i] = (output[offset + i] ${a?"":`- ${v}(mean)`}) *
            ${v}(inv_std_dev) * gamma[offset1d + i]
            ${h?"+ beta[offset1d + i]":""};
        }
      }`},S=[{dims:u,dataType:e[0].dataType}];return r>1&&S.push({dims:m,dataType:1}),r>2&&S.push({dims:m,dataType:1}),r>3&&S.push({dims:n,dataType:e[0].dataType}),{name:"SkipLayerNormalization",shaderCache:{hint:`${x};${y};${_};${$}`,inputDependencies:e.map((E,C)=>"type")},getShaderSource:I,getRunData:()=>({outputs:S,dispatchGroup:{x:Math.ceil(d/p)},programUniforms:w})}},Vh=(e,t)=>{dd(e.inputs);let r=[0];e.outputCount>1&&r.push(-3),e.outputCount>2&&r.push(-3),e.outputCount>3&&r.push(3),e.compute(pd(e.inputs,t,e.outputCount,!1),{outputs:r})}}),cd,er,hd,oa,fd,md,Gh,Hh,Ry=P(()=>{J(),re(),ve(),ie(),cd=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");if(t.axes.length!==0){if(t.axes.length!==t.starts.length||t.axes.length!==t.ends.length)throw new Error("axes, starts and ends must have the same length")}else if(t.starts.length!==t.ends.length)throw new Error("starts and ends must have the same length");e.slice(1).forEach((r,i)=>{if(e[i+1].dataType!==6&&e[i+1].dataType!==7)throw new Error(`Input ${i} must be an array of int32 or int64`)})},er=(e,t)=>{let r=[];if(e.length>t)if(e[t].dataType===7)e[t].getBigInt64Array().forEach(i=>r.push(Number(i)));else if(e[t].dataType===6)e[t].getInt32Array().forEach(i=>r.push(Number(i)));else throw new Error(`Input ${t} must be an array of int32 or int64`);return r},hd=(e,t)=>{if(e.length>1){let r=er(e,1),i=er(e,2),a=er(e,3);return a.length===0&&(a=[...Array(e[0].dims.length).keys()]),he({starts:r,ends:i,axes:a})}else return t},oa=(e,t,r,i,a)=>{let n=e;return e<0&&(n+=r[i[t]]),a[t]<0?Math.max(0,Math.min(n,r[i[t]]-1)):Math.max(0,Math.min(n,r[i[t]]))},fd=(e,t,r)=>`fn calculateInputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
          var input_indices: ${e.type.indices};
          var carry = 0u;
          for (var i = ${r.length-1}; i >= 0; i--) {
            let input_shape_i = ${j("uniforms.input_shape","i",r.length)};
            let steps_i = ${j("uniforms.steps","i",r.length)};
            let signs_i = ${j("uniforms.signs","i",r.length)};
            let starts_i = ${j("uniforms.starts","i",r.length)};
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
      }`,md=(e,t)=>{let r=e[0].dims,i=O.size(r),a=t.axes.length>0?O.normalizeAxes(t.axes,r.length):[...Array(r.length).keys()],n=er(e,4);n.forEach(x=>x!==0||(()=>{throw new Error("step cannot be 0")})),n.length===0&&(n=Array(a.length).fill(1));let s=t.starts.map((x,w)=>oa(x,w,r,a,n)),u=t.ends.map((x,w)=>oa(x,w,r,a,n));if(a.length!==s.length||a.length!==u.length)throw new Error("start, ends and axes should have the same number of elements");if(a.length!==r.length)for(let x=0;x<r.length;++x)a.includes(x)||(s.splice(x,0,0),u.splice(x,0,r[x]),n.splice(x,0,1));let d=n.map(x=>Math.sign(x));n.forEach((x,w,I)=>{if(x<0){let S=(u[w]-s[w])/x,E=s[w],C=E+S*n[w];s[w]=C,u[w]=E,I[w]=-x}});let p=r.slice(0);a.forEach((x,w)=>{p[x]=Math.ceil((u[x]-s[x])/n[x])});let m={dims:p,dataType:e[0].dataType},h=F("output",e[0].dataType,p.length),g=N("input",e[0].dataType,e[0].dims.length),y=O.size(p),_=[{name:"outputSize",type:"u32"},{name:"starts",type:"u32",length:s.length},{name:"signs",type:"i32",length:d.length},{name:"steps",type:"u32",length:n.length}],$=[{type:12,data:y},{type:12,data:s},{type:6,data:d},{type:12,data:n},...K(e[0].dims,p)],T=x=>`
      ${x.registerUniforms(_).declareVariables(g,h)}
        ${fd(g,h,r)}
        ${x.mainStart()}
          ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
          let output_indices = ${h.offsetToIndices("global_idx")};
          let input_indices = calculateInputIndices(output_indices);
          ${h.setByOffset("global_idx",g.getByIndices("input_indices"))}
      }`;return{name:"Slice",shaderCache:{hint:`${d.length}_${s.length}_${n.length}`,inputDependencies:["rank"]},getShaderSource:T,getRunData:()=>({outputs:[m],dispatchGroup:{x:Math.ceil(i/64)},programUniforms:$})}},Gh=(e,t)=>{cd(e.inputs,t);let r=hd(e.inputs,t);e.compute(md(e.inputs,r),{inputs:[0]})},Hh=e=>{let t=e.starts,r=e.ends,i=e.axes;return he({starts:t,ends:r,axes:i})}}),gd,yd,Fh,jh,By=P(()=>{J(),re(),ve(),gt(),ie(),gd=e=>{if(!e||e.length!==1)throw new Error("Softmax op requires 1 input.")},yd=(e,t)=>{let r=e.inputs[0],i=r.dims,a=O.size(i),n=i.length,s=O.normalizeAxis(t.axis,n),u=s<i.length-1,d,p=[];u?(p=Array.from({length:n},(A,v)=>v),p[s]=n-1,p[n-1]=s,d=e.compute(Ne(r,p),{inputs:[r],outputs:[-1]})[0]):d=r;let m=d.dims,h=m[n-1],g=a/h,y=$e(h),_=h/y,$=64;g===1&&($=256);let T=(A,v)=>v===4?`max(max(${A}.x, ${A}.y), max(${A}.z, ${A}.w))`:v===2?`max(${A}.x, ${A}.y)`:v===3?`max(max(${A}.x, ${A}.y), ${A}.z)`:A,x=N("x",d.dataType,d.dims,y),w=F("result",d.dataType,d.dims,y),I=x.type.value,S=Te(d.dataType)==="f32"?`var threadMax = ${I}(-3.4028234663852886e+38f);`:`var threadMax = ${I}(-65504.0h);`,E=A=>`
      var<workgroup> rowMaxShared : ${I};
      var<workgroup> rowSumShared : ${I};
      var<workgroup> threadShared : array<${I}, ${$}>;

      fn getValue(row: i32, col: i32, row_stride: i32) -> ${I} {
        let index = row * row_stride + col;
        return x[index];
      }

      fn setValue(row: i32, col: i32, row_stride: i32, value: ${I}) {
        let index = row * row_stride + col;
        result[index] = value;
      }
      ${A.registerUniform("packedCols","i32").declareVariables(x,w)}
      ${A.mainStart($)}
        let gindex = i32(global_idx);
        let lindex = i32(local_idx);
        const wg = ${$};
        let row = gindex / wg;
        let cols = uniforms.packedCols;
        let row_stride : i32 = uniforms.packedCols;

        // find the rows max
        ${S}
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
          rowMaxShared = ${I}(${T("threadShared[0]",y)});
        }
        workgroupBarrier();

        // find the rows sum
        var threadSum = ${I}(0.0);
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
          rowSumShared = ${I}(${mt("threadShared[0]",y)});
        }
        workgroupBarrier();

        // calculate final value for each element in the row
        for (var col = lindex; col < cols; col += wg) {
          var value = exp(getValue(row, col, row_stride) - rowMaxShared) / rowSumShared;
          // max operation protects against NaN since all values should be >=0
          value = max(value, ${I}(0.0));
          setValue(row, col, row_stride, value);
        }
      }`,C=e.compute({name:"Softmax",shaderCache:{hint:`${y};${$}`,inputDependencies:["type"]},getRunData:()=>({outputs:[{dims:m,dataType:d.dataType}],dispatchGroup:{x:g},programUniforms:[{type:6,data:_}]}),getShaderSource:E},{inputs:[d],outputs:[u?-1:0]})[0];u&&e.compute(Ne(C,p),{inputs:[C]})},Fh=(e,t)=>{gd(e.inputs),yd(e,t)},jh=e=>he({axis:e.axis})}),ua,_d,wd,bd,Kh,Ny=P(()=>{J(),re(),ie(),ua=e=>Array.from(e.getBigInt64Array(),Number),_d=e=>{if(!e||e.length!==2)throw new Error("Tile requires 2 inputs.");if(e[0].dataType!==1&&e[0].dataType!==10&&e[0].dataType!==6&&e[0].dataType!==12)throw new Error("Tile only support float, float16, int32, and uint32 data types");if(e[1].dataType!==7)throw new Error("Tile `repeats` input should be of int64 data type");if(e[1].dims.length!==1)throw new Error("Tile `repeats` input should be 1-D");if(ua(e[1]).length!==e[0].dims.length)throw new Error("Tile `repeats` input should have same number of elements as rank of input data tensor")},wd=(e,t)=>{let r=[];for(let i=0;i<e.length;++i)r.push(e[i]*t[i]);return r},bd=(e,t)=>{let r=e[0].dims,i=t??ua(e[1]),a=wd(r,i),n=O.size(a),s=e[0].dataType,u=N("input",s,r.length),d=F("output",s,a.length),p=m=>`
      const inputShape = ${u.indices(...r)};
      ${m.registerUniform("output_size","u32").declareVariables(u,d)}
      ${m.mainStart()}
      ${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let output_indices = ${d.offsetToIndices("global_idx")};
      var input_indices: ${u.type.indices};
      for (var i = 0; i < ${r.length}; i++) {
        let input_dim_i = ${u.indicesGet("uniforms.input_shape","i")};
        let input_dim_value = ${d.indicesGet("output_indices","i")}  % input_dim_i;

        ${u.indicesSet("input_indices","i","input_dim_value")}
      }
      ${d.setByOffset("global_idx",u.getByIndices("input_indices"))}
    }`;return{name:"Tile",shaderCache:{hint:`${i}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:a,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:[{type:12,data:n},...K(e[0].dims,a)]}),getShaderSource:p}},Kh=e=>{_d(e.inputs),e.compute(bd(e.inputs),{inputs:[0]})}}),$d,vd,Qh,My=P(()=>{J(),re(),ie(),$d=(e,t,r,i,a)=>{let n=F("output_data",a,r.length,4),s=N("a_data",t[1].dataType,t[1].dims.length,4),u=N("b_data",t[2].dataType,t[2].dims.length,4),d=N("c_data",t[0].dataType,t[0].dims.length,4),p,m=(h,g,y)=>`select(${g}, ${h}, ${y})`;if(!i)p=n.setByOffset("global_idx",m(s.getByOffset("global_idx"),u.getByOffset("global_idx"),d.getByOffset("global_idx")));else{let h=(g,y,_="")=>{let $=`a_data[index_a${y}][component_a${y}]`,T=`b_data[index_b${y}][component_b${y}]`,x=`bool(c_data[index_c${y}] & (0xffu << (component_c${y} * 8)))`;return`
            let output_indices${y} = ${n.offsetToIndices(`global_idx * 4u + ${y}u`)};
            let offset_a${y} = ${s.broadcastedIndicesToOffset(`output_indices${y}`,n)};
            let offset_b${y} = ${u.broadcastedIndicesToOffset(`output_indices${y}`,n)};
            let offset_c${y} = ${d.broadcastedIndicesToOffset(`output_indices${y}`,n)};
            let index_a${y} = offset_a${y} / 4u;
            let index_b${y} = offset_b${y} / 4u;
            let index_c${y} = offset_c${y} / 4u;
            let component_a${y} = offset_a${y} % 4u;
            let component_b${y} = offset_b${y} % 4u;
            let component_c${y} = offset_c${y} % 4u;
            ${g}[${y}] = ${_}(${m($,T,x)});
          `};a===9?p=`
            var data = vec4<u32>(0);
            ${h("data",0,"u32")}
            ${h("data",1,"u32")}
            ${h("data",2,"u32")}
            ${h("data",3,"u32")}
            output_data[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:p=`
            ${h("output_data[global_idx]",0)}
            ${h("output_data[global_idx]",1)}
            ${h("output_data[global_idx]",2)}
            ${h("output_data[global_idx]",3)}
          `}return`
        ${e.registerUniform("vec_size","u32").declareVariables(d,s,u,n)}
        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${p}
      }`},vd=e=>{let t=e[1].dims,r=e[2].dims,i=e[0].dims,a=e[1].dataType,n=!(O.areEqual(t,r)&&O.areEqual(r,i)),s=t,u=O.size(t);if(n){let p=Pt.calcShape(Pt.calcShape(t,r,!1),i,!1);if(!p)throw new Error("Can't perform where op on the given tensors");s=p,u=O.size(s)}let d=Math.ceil(u/4);return{name:"Where",shaderCache:{inputDependencies:["rank","rank","rank"]},getShaderSource:p=>$d(p,e,s,n,a),getRunData:()=>({outputs:[{dims:s,dataType:a}],dispatchGroup:{x:Math.ceil(u/64/4)},programUniforms:[{type:12,data:d},...K(i,t,r,s)]})}},Qh=e=>{e.compute(vd(e.inputs))}}),Zh,Dy=P(()=>{Yg(),Va(),Xg(),Jg(),ey(),ty(),ry(),oy(),ly(),dy(),py(),cy(),hy(),fy(),my(),gy(),yy(),_y(),wy(),by(),$y(),vy(),xy(),Sy(),Ty(),mh(),ky(),Iy(),Ey(),zy(),Cy(),La(),Ay(),bh(),Oy(),Ry(),By(),_h(),Ny(),gt(),Ga(),My(),Zh=new Map([["Abs",[Vp]],["Acos",[Gp]],["Acosh",[Hp]],["Add",[Tc]],["ArgMax",[Pp,wa]],["ArgMin",[Up,wa]],["Asin",[Fp]],["Asinh",[jp]],["Atan",[Kp]],["Atanh",[Qp]],["Attention",[qp]],["AveragePool",[zh,Eh]],["BatchNormalization",[Wp]],["BiasAdd",[Lp]],["BiasSplitGelu",[Sc]],["Cast",[Yp,Zp]],["Ceil",[Jp]],["Clip",[Xp]],["Concat",[Nc,Mc]],["Conv",[Ta,Sa]],["ConvTranspose",[Fc,Hc]],["Cos",[ec]],["Cosh",[tc]],["CumSum",[jc,Kc]],["DepthToSpace",[Qc,Zc]],["DequantizeLinear",[Mh,Dh]],["Div",[kc]],["Einsum",[Yc,Xc]],["Elu",[rc,nr]],["Equal",[Ic]],["Erf",[ic]],["Exp",[ac]],["Expand",[Jc]],["FastGelu",[eh]],["Floor",[nc]],["FusedConv",[Ta,Sa]],["Gather",[rh,th]],["GatherElements",[uh,oh]],["GatherBlockQuantized",[nh,sh]],["GatherND",[ih,ah]],["Gelu",[sc]],["Gemm",[dh,lh]],["GlobalAveragePool",[Ah,Ch]],["GlobalMaxPool",[Nh,Bh]],["Greater",[Ac]],["GreaterOrEqual",[Rc]],["GridSample",[ph,ch]],["GroupQueryAttention",[$h]],["HardSigmoid",[fc,hc]],["InstanceNormalization",[vh]],["LayerNormalization",[xh]],["LeakyRelu",[oc,nr]],["Less",[Oc]],["LessOrEqual",[Bc]],["Log",[vc]],["MatMul",[Sh]],["MatMulNBits",[Th,kh]],["MaxPool",[Oh,Rh]],["Mul",[Ec]],["MultiHeadAttention",[fh,hh]],["Neg",[lc]],["Not",[uc]],["Pad",[Ih]],["Pow",[zc]],["QuickGelu",[xc,nr]],["Range",[Uh]],["Reciprocal",[dc]],["ReduceMin",[Rp]],["ReduceMean",[Ep]],["ReduceMax",[Op]],["ReduceSum",[Np]],["ReduceProd",[Bp]],["ReduceL1",[zp]],["ReduceL2",[Cp]],["ReduceLogSum",[Dp]],["ReduceLogSumExp",[Ap]],["ReduceSumSquare",[Mp]],["Relu",[pc]],["Resize",[Wh,Lh]],["RotaryEmbedding",[wh]],["ScatterND",[qh,Ph]],["Sigmoid",[cc]],["Sin",[mc]],["Sinh",[gc]],["Slice",[Gh,Hh]],["SkipLayerNormalization",[Vh]],["Split",[gh,yh]],["Sqrt",[yc]],["Softmax",[Fh,jh]],["Sub",[Cc]],["Tan",[_c]],["Tanh",[wc]],["ThresholdedRelu",[$c,nr]],["Tile",[Kh]],["Transpose",[gp,yp]],["Where",[Qh]]])}),Yh,Uy=P(()=>{Pe(),nt(),ie(),Yh=class{constructor(e){this.backend=e,this.repo=new Map,this.attributesBound=!1}getArtifact(e){return this.repo.get(e)}setArtifact(e,t){this.repo.set(e,t)}run(e,t,r,i,a){et(e.programInfo.name);let n=this.backend.device,s=this.backend.getComputePassEncoder();this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2);let u=[];for(let p of t)u.push({binding:u.length,resource:{buffer:p.buffer}});for(let p of r)u.push({binding:u.length,resource:{buffer:p.buffer}});a&&u.push({binding:u.length,resource:a});let d=n.createBindGroup({layout:e.computePipeline.getBindGroupLayout(0),entries:u,label:e.programInfo.name});if(this.backend.sessionStatus==="capturing"){let p={kernelId:this.backend.currentKernelId,computePipeline:e.computePipeline,bindGroup:d,dispatchGroup:i};this.backend.capturedCommandList.get(this.backend.currentSessionId).push(p)}s.setPipeline(e.computePipeline),s.setBindGroup(0,d),s.dispatchWorkgroups(...i),this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2+1),this.backend.pendingDispatchNumber++,(this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber||this.backend.queryType==="at-passes")&&this.backend.endComputePass(),this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber&&this.backend.flush(),je(e.programInfo.name)}dispose(){}build(e,t){et(e.name);let r=this.backend.device,i=[];[{feature:"shader-f16",extension:"f16"},{feature:"subgroups",extension:"subgroups"}].forEach(p=>{r.features.has(p.feature)&&i.push(`enable ${p.extension};`)});let a=mp(t,this.backend.device.limits),n=e.getShaderSource(a),s=`${i.join(`
`)}
${a.additionalImplementations}
${n}`,u=r.createShaderModule({code:s,label:e.name});le("verbose",()=>`[WebGPU] ${e.name} shader code: ${s}`);let d=r.createComputePipeline({compute:{module:u,entryPoint:"main"},layout:"auto",label:e.name});return je(e.name),{programInfo:e,computePipeline:d,uniformVariablesInfo:a.variablesInfo}}normalizeDispatchGroupSize(e){let t=typeof e=="number"?e:e.x,r=typeof e=="number"?1:e.y||1,i=typeof e=="number"?1:e.z||1,a=this.backend.device.limits.maxComputeWorkgroupsPerDimension;if(t<=a&&r<=a&&i<=a)return[t,r,i];let n=t*r*i,s=Math.ceil(Math.sqrt(n));if(s>a){if(s=Math.ceil(Math.cbrt(n)),s>a)throw new Error("Total dispatch size exceeds WebGPU maximum.");return[s,s,s]}else return[s,s,1]}}}),Xh={};Wt(Xh,{WebGpuBackend:()=>Jh});var xd,Sd,Td,Jh,Py=P(()=>{Pe(),J(),nt(),dp(),Qg(),Dy(),Uy(),xd=(e,t)=>{if(t.length!==e.length)throw new Error(`inputDependencies length ${t.length} is not equal to inputTensors length ${e.length}.`);let r=[];for(let i=0;i<e.length;++i){let a=e[i].dataType;switch(t[i]){case"none":{r.push("");break}case"type":{r.push(`${a}`);break}case"rank":{let n=e[i].dims.length;r.push(`${a};${n}`);break}case"dims":{let n=e[i].dims.join(",");r.push(`${a};${n}`);break}default:throw new Error(`unsupported input dependency: ${t[i]}`)}}return r.join("|")},Sd=(e,t,r)=>{let i=e.name;return e.shaderCache?.hint&&(i+="["+e.shaderCache.hint+"]"),i+=":"+r+`:${xd(t,e.shaderCache?.inputDependencies??new Array(t.length).fill("dims"))}`,i},Td=class{constructor(e){e&&(this.architecture=e.architecture,this.vendor=e.vendor)}isArchitecture(e){return this.architecture===e}isVendor(e){return this.vendor===e}},Jh=class{constructor(){this.currentSessionId=null,this.currentKernelId=null,this.commandEncoder=null,this.computePassEncoder=null,this.maxDispatchNumber=16,this.pendingDispatchNumber=0,this.pendingKernels=[],this.pendingQueries=new Map,this.sessionStatus="default",this.capturedCommandList=new Map,this.capturedPendingKernels=new Map,this.sessionExternalDataMapping=new Map}get currentKernelCustomData(){if(this.currentKernelId===null)throw new Error("currentKernelCustomData(): currentKernelId is null. (should not happen)");let e=this.kernelCustomData.get(this.currentKernelId);return e||(e={},this.kernelCustomData.set(this.currentKernelId,e)),e}async initialize(e,t){this.env=e;let r=[],i={requiredLimits:{maxComputeWorkgroupStorageSize:t.limits.maxComputeWorkgroupStorageSize,maxComputeWorkgroupsPerDimension:t.limits.maxComputeWorkgroupsPerDimension,maxStorageBufferBindingSize:t.limits.maxStorageBufferBindingSize,maxBufferSize:t.limits.maxBufferSize,maxComputeInvocationsPerWorkgroup:t.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupSizeX:t.limits.maxComputeWorkgroupSizeX,maxComputeWorkgroupSizeY:t.limits.maxComputeWorkgroupSizeY,maxComputeWorkgroupSizeZ:t.limits.maxComputeWorkgroupSizeZ},requiredFeatures:r},a=n=>t.features.has(n)&&r.push(n)&&!0;a("chromium-experimental-timestamp-query-inside-passes")||a("timestamp-query"),a("shader-f16"),a("subgroups"),this.device=await t.requestDevice(i),this.adapterInfo=new Td(t.info||await t.requestAdapterInfo()),this.gpuDataManager=hp(this),this.programManager=new Yh(this),this.kernels=new Map,this.kernelPersistentData=new Map,this.kernelCustomData=new Map,Ua(e.logLevel,!!e.debug),this.device.onuncapturederror=n=>{n.error instanceof GPUValidationError&&console.error(`An uncaught WebGPU validation error was raised: ${n.error.message}`)},Object.defineProperty(this.env.webgpu,"device",{value:this.device,writable:!1,enumerable:!0,configurable:!1}),Object.defineProperty(this.env.webgpu,"adapter",{value:t,writable:!1,enumerable:!0,configurable:!1}),this.setQueryType()}dispose(){typeof this.querySet<"u"&&this.querySet.destroy(),this.gpuDataManager.dispose()}getCommandEncoder(){return this.commandEncoder||(this.commandEncoder=this.device.createCommandEncoder()),this.commandEncoder}getComputePassEncoder(){if(!this.computePassEncoder){let e=this.getCommandEncoder(),t={};this.queryType==="at-passes"&&(t.timestampWrites={querySet:this.querySet,beginningOfPassWriteIndex:this.pendingDispatchNumber*2,endOfPassWriteIndex:this.pendingDispatchNumber*2+1}),this.computePassEncoder=e.beginComputePass(t)}return this.computePassEncoder}endComputePass(){this.computePassEncoder&&(this.computePassEncoder.end(),this.computePassEncoder=null)}flush(){if(!this.commandEncoder)return;et(),this.endComputePass();let e;this.queryType!=="none"&&(this.commandEncoder.resolveQuerySet(this.querySet,0,this.pendingDispatchNumber*2,this.queryResolveBuffer,0),e=this.device.createBuffer({size:this.pendingDispatchNumber*2*8,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),this.pendingQueries.set(e,this.pendingKernels),this.pendingKernels=[],this.commandEncoder.copyBufferToBuffer(this.queryResolveBuffer,0,e,0,this.pendingDispatchNumber*2*8)),this.device.queue.submit([this.commandEncoder.finish()]),this.gpuDataManager.refreshPendingBuffers(),this.commandEncoder=null,this.pendingDispatchNumber=0,this.queryType!=="none"&&e.mapAsync(GPUMapMode.READ).then(()=>{let t=new BigUint64Array(e.getMappedRange()),r=this.pendingQueries.get(e);for(let i=0;i<t.length/2;i++){let a=r[i],n=a.kernelId,s=this.kernels.get(n),u=s.kernelType,d=s.kernelName,p=a.programName,m=a.inputTensorViews,h=a.outputTensorViews,g=t[i*2],y=t[i*2+1];typeof this.queryTimeBase>"u"&&(this.queryTimeBase=g);let _=Number(g-this.queryTimeBase),$=Number(y-this.queryTimeBase);if(!Number.isSafeInteger(_)||!Number.isSafeInteger($))throw new RangeError("incorrect timestamp range");if(this.env.webgpu.profiling?.ondata)this.env.webgpu.profiling.ondata({version:1,inputsMetadata:m.map(T=>({dims:T.dims,dataType:at(T.dataType)})),outputsMetadata:h.map(T=>({dims:T.dims,dataType:at(T.dataType)})),kernelId:n,kernelType:u,kernelName:d,programName:p,startTime:_,endTime:$});else{let T="";m.forEach((w,I)=>{T+=`input[${I}]: [${w.dims}] | ${at(w.dataType)}, `});let x="";h.forEach((w,I)=>{x+=`output[${I}]: [${w.dims}] | ${at(w.dataType)}, `}),console.log(`[profiling] kernel "${n}|${u}|${d}|${p}" ${T}${x}start time: ${_} ns, execution time: ${$-_} ns`)}Ur("GPU",`${p}::${g}::${y}`)}e.unmap(),this.pendingQueries.delete(e)}),je()}run(e,t,r,i,a,n){et(e.name);let s=[];for(let w=0;w<t.length;++w){let I=t[w].data;if(I===0)continue;let S=this.gpuDataManager.get(I);if(!S)throw new Error(`no GPU data for input: ${I}`);s.push(S)}let{outputs:u,dispatchGroup:d,programUniforms:p}=e.getRunData(t),m=r.length===0?u.map((w,I)=>I):r;if(m.length!==u.length)throw new Error(`Output size ${m.length} must be equal to ${u.length}.`);let h=[],g=[];for(let w=0;w<u.length;++w){if(!Number.isInteger(m[w])||m[w]<-3||m[w]>=n)throw new Error(`Invalid output index: ${m[w]}`);if(m[w]===-3)continue;let I=m[w]===-1,S=m[w]===-2,E=I||S?a(u[w].dataType,u[w].dims):i(m[w],u[w].dataType,u[w].dims);if(h.push(E),E.data===0)continue;let C=this.gpuDataManager.get(E.data);if(!C)throw new Error(`no GPU data for output: ${E.data}`);if(I&&this.temporaryData.push(C),S){let A=this.kernelPersistentData.get(this.currentKernelId);A||(A=[],this.kernelPersistentData.set(this.currentKernelId,A)),A.push(C)}g.push(C)}if(s.length!==t.length||g.length!==h.length){if(g.length===0)return je(e.name),h;throw new Error(`Program ${e.name} has zero-sized tensor(s) in inputs or outputs. This is not supported now.`)}let y;if(p){let w=0,I=[];p.forEach(A=>{let v=typeof A.data=="number"?[A.data]:A.data;if(v.length===0)return;let U=A.type===10?2:4,q,Y;A.type===10?(Y=v.length>4?16:v.length>2?8:v.length*U,q=v.length>4?16:U*v.length):(Y=v.length<=2?v.length*U:16,q=16),w=Math.ceil(w/Y)*Y,I.push(w);let H=A.type===10?8:4;w+=v.length>4?Math.ceil(v.length/H)*q:v.length*U});let S=16;w=Math.ceil(w/S)*S;let E=new ArrayBuffer(w);p.forEach((A,v)=>{let U=I[v],q=typeof A.data=="number"?[A.data]:A.data;if(A.type===6)new Int32Array(E,U,q.length).set(q);else if(A.type===12)new Uint32Array(E,U,q.length).set(q);else if(A.type===10)new Uint16Array(E,U,q.length).set(q);else if(A.type===1)new Float32Array(E,U,q.length).set(q);else throw new Error(`Unsupported uniform type: ${at(A.type)}`)});let C=this.gpuDataManager.create(w,GPUBufferUsage.COPY_DST|GPUBufferUsage.UNIFORM);this.device.queue.writeBuffer(C.buffer,0,E,0,w),this.gpuDataManager.release(C.id),y={offset:0,size:w,buffer:C.buffer}}let _=this.programManager.normalizeDispatchGroupSize(d),$=_[1]===1&&_[2]===1,T=Sd(e,t,$),x=this.programManager.getArtifact(T);if(x||(x=this.programManager.build(e,_),this.programManager.setArtifact(T,x),le("info",()=>`[artifact] key: ${T}, programName: ${e.name}`)),p&&x.uniformVariablesInfo){if(p.length!==x.uniformVariablesInfo.length)throw new Error(`Uniform variables count mismatch: expect ${x.uniformVariablesInfo.length}, got ${p.length} in program "${x.programInfo.name}".`);for(let w=0;w<p.length;w++){let I=p[w],S=I.type,E=typeof I.data=="number"?1:I.data.length,[C,A]=x.uniformVariablesInfo[w];if(S!==C||E!==A)throw new Error(`Uniform variable ${w} mismatch: expect type ${C} with size ${A}, got type ${S} with size ${E} in program "${x.programInfo.name}".`)}}if(le("info",()=>`[ProgramManager] run "${e.name}" (key=${T}) with ${_[0]}x${_[1]}x${_[2]}`),this.queryType!=="none"||this.sessionStatus==="capturing"){let w={kernelId:this.currentKernelId,programName:x.programInfo.name,inputTensorViews:t,outputTensorViews:h};this.pendingKernels.push(w),this.sessionStatus==="capturing"&&this.capturedPendingKernels.get(this.currentSessionId).push(w)}return this.programManager.run(x,s,g,_,y),je(e.name),h}upload(e,t){this.gpuDataManager.upload(e,t)}memcpy(e,t){this.gpuDataManager.memcpy(e,t)}async download(e,t){await this.gpuDataManager.download(e,t)}alloc(e){return this.gpuDataManager.create(e).id}free(e){return this.gpuDataManager.release(e)}createKernel(e,t,r,i){let a=Zh.get(e);if(!a)throw new Error(`kernel not implemented: ${e}`);let n={kernelType:e,kernelName:i,kernelEntry:a[0],attributes:[a[1],r]};this.kernels.set(t,n)}releaseKernel(e){let t=this.kernelPersistentData.get(e);if(t){for(let r of t)this.gpuDataManager.release(r.id);this.kernelPersistentData.delete(e)}this.kernelCustomData.delete(e),this.kernels.delete(e)}computeKernel(e,t,r){let i=this.kernels.get(e);if(!i)throw new Error(`kernel not created: ${e}`);let a=i.kernelType,n=i.kernelName,s=i.kernelEntry,u=i.attributes;if(this.currentKernelId!==null)throw new Error(`kernel "[${a}] ${n}" is not allowed to be called recursively`);this.currentKernelId=e,u[0]&&(u[1]=u[0](u[1]),u[0]=void 0),le("info",()=>`[WebGPU] Start to run kernel "[${a}] ${n}"...`);let d=this.env.debug;this.temporaryData=[];try{return d&&this.device.pushErrorScope("validation"),s(t,u[1]),0}catch(p){return r.push(Promise.resolve(`[WebGPU] Kernel "[${a}] ${n}" failed. ${p}`)),1}finally{d&&r.push(this.device.popErrorScope().then(p=>p?`GPU validation error for kernel "[${a}] ${n}": ${p.message}`:null));for(let p of this.temporaryData)this.gpuDataManager.release(p.id);this.temporaryData=[],this.currentKernelId=null}}registerBuffer(e,t,r,i){let a=this.sessionExternalDataMapping.get(e);a||(a=new Map,this.sessionExternalDataMapping.set(e,a));let n=a.get(t),s=this.gpuDataManager.registerExternalBuffer(r,i,n);return a.set(t,[s,r]),s}unregisterBuffers(e){let t=this.sessionExternalDataMapping.get(e);t&&(t.forEach(r=>this.gpuDataManager.unregisterExternalBuffer(r[0])),this.sessionExternalDataMapping.delete(e))}getBuffer(e){let t=this.gpuDataManager.get(e);if(!t)throw new Error(`no GPU data for buffer: ${e}`);return t.buffer}createDownloader(e,t,r){return async()=>{let i=await ga(this,e,t);return Pa(i.buffer,r)}}writeTimestamp(e){this.queryType==="inside-passes"&&this.computePassEncoder.writeTimestamp(this.querySet,e)}setQueryType(){this.queryType="none",(this.env.webgpu.profiling?.mode==="default"||(typeof this.env.trace>"u"?this.env.wasm.trace:this.env.trace))&&(this.device.features.has("chromium-experimental-timestamp-query-inside-passes")?this.queryType="inside-passes":this.device.features.has("timestamp-query")&&(this.queryType="at-passes"),this.queryType!=="none"&&typeof this.querySet>"u"&&(this.querySet=this.device.createQuerySet({type:"timestamp",count:this.maxDispatchNumber*2}),this.queryResolveBuffer=this.device.createBuffer({size:this.maxDispatchNumber*2*8,usage:GPUBufferUsage.COPY_SRC|GPUBufferUsage.QUERY_RESOLVE})))}captureBegin(){le("info","captureBegin"),this.capturedCommandList.get(this.currentSessionId)||this.capturedCommandList.set(this.currentSessionId,[]),this.capturedPendingKernels.get(this.currentSessionId)||this.capturedPendingKernels.set(this.currentSessionId,[]),this.flush(),this.sessionStatus="capturing"}captureEnd(){le("info","captureEnd"),this.flush(),this.sessionStatus="default"}replay(){le("info","replay"),this.sessionStatus="replaying";let e=this.capturedCommandList.get(this.currentSessionId),t=this.capturedPendingKernels.get(this.currentSessionId),r=e.length;this.pendingKernels=[];for(let i=0;i<r;i++){let a=this.getComputePassEncoder(),n=e[i];this.writeTimestamp(this.pendingDispatchNumber*2),a.setPipeline(n.computePipeline),a.setBindGroup(0,n.bindGroup),a.dispatchWorkgroups(...n.dispatchGroup),this.writeTimestamp(this.pendingDispatchNumber*2+1),this.pendingDispatchNumber++,this.queryType!=="none"&&this.pendingKernels.push(t[i]),(this.pendingDispatchNumber>=this.maxDispatchNumber||this.queryType==="at-passes")&&this.endComputePass(),this.pendingDispatchNumber>=this.maxDispatchNumber&&this.flush()}this.flush(),this.sessionStatus="default"}onCreateSession(){this.gpuDataManager.onCreateSession()}onReleaseSession(e){this.unregisterBuffers(e),this.capturedCommandList.has(e)&&this.capturedCommandList.delete(e),this.capturedPendingKernels.has(e)&&this.capturedPendingKernels.delete(e),this.gpuDataManager.onReleaseSession(e)}onRunStart(e){this.currentSessionId=e,this.setQueryType()}}}),ef={};Wt(ef,{init:()=>tf});var Rr,kd,tf,qy=P(()=>{J(),nt(),re(),Kg(),Rr=class rf{constructor(t,r,i,a){this.module=t,this.dataType=r,this.data=i,this.dims=a}getFloat32Array(){if(this.dataType!==1)throw new Error("Invalid data type");let t=O.size(this.dims);return t===0?new Float32Array:new Float32Array(this.module.HEAP8.buffer,this.data,t)}getBigInt64Array(){if(this.dataType!==7)throw new Error("Invalid data type");let t=O.size(this.dims);return t===0?new BigInt64Array:new BigInt64Array(this.module.HEAP8.buffer,this.data,t)}getInt32Array(){if(this.dataType!==6)throw new Error("Invalid data type");let t=O.size(this.dims);return t===0?new Int32Array:new Int32Array(this.module.HEAP8.buffer,this.data,t)}getUint16Array(){if(this.dataType!==10&&this.dataType!==4)throw new Error("Invalid data type");let t=O.size(this.dims);return t===0?new Uint16Array:new Uint16Array(this.module.HEAP8.buffer,this.data,t)}reshape(t){if(O.size(t)!==O.size(this.dims))throw new Error("Invalid new shape");return new rf(this.module,this.dataType,this.data,t)}},kd=class{constructor(e,t,r){this.module=e,this.backend=t,this.customDataOffset=0,this.customDataSize=0,this.adapterInfo=t.adapterInfo;let i=e.PTR_SIZE,a=r/e.PTR_SIZE,n=i===4?"i32":"i64";this.opKernelContext=Number(e.getValue(i*a++,n));let s=Number(e.getValue(i*a++,n));this.outputCount=Number(e.getValue(i*a++,n)),this.customDataOffset=Number(e.getValue(i*a++,"*")),this.customDataSize=Number(e.getValue(i*a++,n));let u=[];for(let d=0;d<s;d++){let p=Number(e.getValue(i*a++,n)),m=Number(e.getValue(i*a++,"*")),h=Number(e.getValue(i*a++,n)),g=[];for(let y=0;y<h;y++)g.push(Number(e.getValue(i*a++,n)));u.push(new Rr(e,p,m,g))}this.inputs=u}get kernelCustomData(){return this.backend.currentKernelCustomData}get customDataBuffer(){return this.module.HEAPU8.subarray(this.customDataOffset,this.customDataOffset+this.customDataSize)}compute(e,t){let r=t?.inputs?.map(s=>typeof s=="number"?this.inputs[s]:s)??this.inputs,i=t?.outputs??[],a=(s,u,d)=>new Rr(this.module,u,this.output(s,d),d),n=(s,u)=>{let d=kt(s,u);if(!d)throw new Error(`Unsupported data type: ${s}`);let p=d>0?this.backend.gpuDataManager.create(d).id:0;return new Rr(this.module,s,p,u)};return this.backend.run(e,r,i,a,n,this.outputCount)}output(e,t){let r=this.module.stackSave();try{let i=this.module.PTR_SIZE,a=i===4?"i32":"i64",n=this.module.stackAlloc((1+t.length)*i);this.module.setValue(n,t.length,a);for(let s=0;s<t.length;s++)this.module.setValue(n+i*(s+1),t[s],a);return this.module._JsepOutput(this.opKernelContext,e,n)}catch(i){throw new Error(`Failed to generate kernel's output[${e}] with dims [${t}]. If you are running with pre-allocated output, please make sure the output type/dims are correct. Error: ${i}`)}finally{this.module.stackRestore(r)}}},tf=async(e,t,r,i)=>{let a=t.jsepInit;if(!a)throw new Error("Failed to initialize JSEP. The WebAssembly module is not built with JSEP support.");if(e==="webgpu"){let n=(Py(),ur(Xh)).WebGpuBackend,s=new n;await s.initialize(r,i),a("webgpu",[s,u=>s.alloc(Number(u)),u=>s.free(u),(u,d,p,m=!1)=>{if(m)le("verbose",()=>`[WebGPU] jsepCopyGpuToGpu: src=${Number(u)}, dst=${Number(d)}, size=${Number(p)}`),s.memcpy(Number(u),Number(d));else{le("verbose",()=>`[WebGPU] jsepCopyCpuToGpu: dataOffset=${Number(u)}, gpuDataId=${Number(d)}, size=${Number(p)}`);let h=t.HEAPU8.subarray(Number(u>>>0),Number(u>>>0)+Number(p));s.upload(Number(d),h)}},async(u,d,p)=>{le("verbose",()=>`[WebGPU] jsepCopyGpuToCpu: gpuDataId=${u}, dataOffset=${d}, size=${p}`),await s.download(Number(u),()=>t.HEAPU8.subarray(Number(d)>>>0,Number(d+p)>>>0))},(u,d,p)=>s.createKernel(u,Number(d),p,t.UTF8ToString(t._JsepGetNodeName(Number(d)))),u=>s.releaseKernel(u),(u,d,p,m)=>{le("verbose",()=>`[WebGPU] jsepRun: sessionHandle=${p}, kernel=${u}, contextDataOffset=${d}`);let h=new kd(t,s,Number(d));return s.computeKernel(Number(u),h,m)},()=>s.captureBegin(),()=>s.captureEnd(),()=>s.replay()])}else{let n=new cp(r);a("webnn",[n,()=>n.reserveTensorId(),s=>n.releaseTensorId(s),async(s,u,d,p,m)=>n.ensureTensor(s,u,d,p,m),(s,u)=>{n.uploadTensor(s,u)},async(s,u)=>n.downloadTensor(s,u),(s,u)=>n.registerMLContext(s,u),!!r.trace])}}}),Id,Za,Ya,ht,Ed,la,Hr,Xa,Ja,da,en,tn,rn,af=P(()=>{Pe(),Hg(),Fg(),J(),Ot(),Ba(),sp(),Id=(e,t)=>{ge()._OrtInit(e,t)!==0&&fe("Can't initialize onnxruntime.")},Za=async e=>{Id(e.wasm.numThreads,qr(e.logLevel))},Ya=async(e,t)=>{ge().asyncInit?.();let r=e.webgpu.adapter;if(t==="webgpu"){if(typeof navigator>"u"||!navigator.gpu)throw new Error("WebGPU is not supported in current environment");if(r){if(typeof r.limits!="object"||typeof r.features!="object"||typeof r.requestDevice!="function")throw new Error("Invalid GPU adapter set in `env.webgpu.adapter`. It must be a GPUAdapter object.")}else{let i=e.webgpu.powerPreference;if(i!==void 0&&i!=="low-power"&&i!=="high-performance")throw new Error(`Invalid powerPreference setting: "${i}"`);let a=e.webgpu.forceFallbackAdapter;if(a!==void 0&&typeof a!="boolean")throw new Error(`Invalid forceFallbackAdapter setting: "${a}"`);if(r=await navigator.gpu.requestAdapter({powerPreference:i,forceFallbackAdapter:a}),!r)throw new Error('Failed to get GPU adapter. You may need to enable flag "--enable-unsafe-webgpu" if you are using Chrome.')}}if(t==="webnn"&&(typeof navigator>"u"||!navigator.ml))throw new Error("WebNN is not supported in current environment");{let i=(qy(),ur(ef)).init;t==="webgpu"&&await i("webgpu",ge(),e,r),t==="webnn"&&await i("webnn",ge(),e)}},ht=new Map,Ed=e=>{let t=ge(),r=t.stackSave();try{let i=t.PTR_SIZE,a=t.stackAlloc(2*i);t._OrtGetInputOutputCount(e,a,a+i)!==0&&fe("Can't get session input/output count.");let n=i===4?"i32":"i64";return[Number(t.getValue(a,n)),Number(t.getValue(a+i,n))]}finally{t.stackRestore(r)}},la=(e,t)=>{let r=ge(),i=r.stackSave(),a=0;try{let n=r.PTR_SIZE,s=r.stackAlloc(2*n);r._OrtGetInputOutputMetadata(e,t,s,s+n)!==0&&fe("Can't get session input/output metadata.");let u=Number(r.getValue(s,"*"));a=Number(r.getValue(s+n,"*"));let d=r.HEAP32[a/4];if(d===0)return[u,0];let p=r.HEAPU32[a/4+1],m=[];for(let h=0;h<p;h++){let g=Number(r.getValue(a+8+h*n,"*"));m.push(g!==0?r.UTF8ToString(g):Number(r.getValue(a+8+(h+p)*n,"*")))}return[u,d,m]}finally{r.stackRestore(i),a!==0&&r._OrtFree(a)}},Hr=e=>{let t=ge(),r=t._malloc(e.byteLength);if(r===0)throw new Error(`Can't create a session. failed to allocate a buffer of size ${e.byteLength}.`);return t.HEAPU8.set(e,r),[r,e.byteLength]},Xa=async(e,t)=>{let r,i,a=ge();Array.isArray(e)?[r,i]=e:e.buffer===a.HEAPU8.buffer?[r,i]=[e.byteOffset,e.byteLength]:[r,i]=Hr(e);let n=0,s=0,u=0,d=[],p=[],m=[];try{if([s,d]=await np(t),t?.externalData&&a.mountExternalData){let S=[];for(let E of t.externalData){let C=typeof E=="string"?E:E.path;S.push(Da(typeof E=="string"?E:E.data).then(A=>{a.mountExternalData(C,A)}))}await Promise.all(S)}for(let S of t?.executionProviders??[])if((typeof S=="string"?S:S.name)==="webnn"){if(a.shouldTransferToMLTensor=!1,typeof S!="string"){let E=S,C=E?.context,A=E?.gpuDevice,v=E?.deviceType,U=E?.powerPreference;C?a.currentContext=C:A?a.currentContext=await a.webnnCreateMLContext(A):a.currentContext=await a.webnnCreateMLContext({deviceType:v,powerPreference:U})}else a.currentContext=await a.webnnCreateMLContext();break}n=await a._OrtCreateSession(r,i,s),a.webgpuOnCreateSession?.(n),n===0&&fe("Can't create a session."),a.jsepOnCreateSession?.(),a.currentContext&&(a.webnnRegisterMLContext(n,a.currentContext),a.currentContext=void 0,a.shouldTransferToMLTensor=!0);let[h,g]=Ed(n),y=!!t?.enableGraphCapture,_=[],$=[],T=[],x=[],w=[];for(let S=0;S<h;S++){let[E,C,A]=la(n,S);E===0&&fe("Can't get an input name."),p.push(E);let v=a.UTF8ToString(E);_.push(v),T.push(C===0?{name:v,isTensor:!1}:{name:v,isTensor:!0,type:at(C),shape:A})}for(let S=0;S<g;S++){let[E,C,A]=la(n,S+h);E===0&&fe("Can't get an output name."),m.push(E);let v=a.UTF8ToString(E);$.push(v),x.push(C===0?{name:v,isTensor:!1}:{name:v,isTensor:!0,type:at(C),shape:A});{if(y&&t?.preferredOutputLocation===void 0){w.push("gpu-buffer");continue}let U=typeof t?.preferredOutputLocation=="string"?t.preferredOutputLocation:t?.preferredOutputLocation?.[v]??"cpu",q=a.webnnIsGraphOutput;if(U==="cpu"&&q&&q(n,v)){w.push("ml-tensor-cpu-output");continue}if(U!=="cpu"&&U!=="cpu-pinned"&&U!=="gpu-buffer"&&U!=="ml-tensor")throw new Error(`Not supported preferred output location: ${U}.`);if(y&&U!=="gpu-buffer")throw new Error(`Not supported preferred output location: ${U}. Only 'gpu-buffer' location is supported when enableGraphCapture is true.`);w.push(U)}}let I=null;return w.some(S=>S==="gpu-buffer"||S==="ml-tensor"||S==="ml-tensor-cpu-output")&&(u=a._OrtCreateBinding(n),u===0&&fe("Can't create IO binding."),I={handle:u,outputPreferredLocations:w,outputPreferredLocationsEncoded:w.map(S=>S==="ml-tensor-cpu-output"?"ml-tensor":S).map(S=>fa(S))}),ht.set(n,[n,p,m,I,y,!1]),[n,_,$,T,x]}catch(h){throw p.forEach(g=>a._OrtFree(g)),m.forEach(g=>a._OrtFree(g)),u!==0&&a._OrtReleaseBinding(u)!==0&&fe("Can't release IO binding."),n!==0&&a._OrtReleaseSession(n)!==0&&fe("Can't release session."),h}finally{a._free(r),s!==0&&a._OrtReleaseSessionOptions(s)!==0&&fe("Can't release session options."),d.forEach(h=>a._free(h)),a.unmountExternalData?.()}},Ja=e=>{let t=ge(),r=ht.get(e);if(!r)throw new Error(`cannot release session. invalid session id: ${e}`);let[i,a,n,s,u]=r;s&&(u&&t._OrtClearBoundOutputs(s.handle)!==0&&fe("Can't clear bound outputs."),t._OrtReleaseBinding(s.handle)!==0&&fe("Can't release IO binding.")),t.jsepOnReleaseSession?.(e),t.webnnOnReleaseSession?.(e),t.webgpuOnReleaseSession?.(e),a.forEach(d=>t._OrtFree(d)),n.forEach(d=>t._OrtFree(d)),t._OrtReleaseSession(i)!==0&&fe("Can't release session."),ht.delete(e)},da=async(e,t,r,i,a,n,s=!1)=>{if(!e){t.push(0);return}let u=ge(),d=u.PTR_SIZE,p=e[0],m=e[1],h=e[3],g=h,y,_;if(p==="string"&&(h==="gpu-buffer"||h==="ml-tensor"))throw new Error("String tensor is not supported on GPU.");if(s&&h!=="gpu-buffer")throw new Error(`External buffer must be provided for input/output index ${n} when enableGraphCapture is true.`);if(h==="gpu-buffer"){let x=e[2].gpuBuffer;_=kt(Tt(p),m);{let w=u.jsepRegisterBuffer;if(!w)throw new Error('Tensor location "gpu-buffer" is not supported without using WebGPU.');y=w(i,n,x,_)}}else if(h==="ml-tensor"){let x=e[2].mlTensor;_=kt(Tt(p),m);let w=u.webnnRegisterMLTensor;if(!w)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');y=w(i,x,Tt(p),m)}else{let x=e[2];if(Array.isArray(x)){_=d*x.length,y=u._malloc(_),r.push(y);for(let w=0;w<x.length;w++){if(typeof x[w]!="string")throw new TypeError(`tensor data at index ${w} is not a string`);u.setValue(y+w*d,Fe(x[w],r),"*")}}else{let w=u.webnnIsGraphInput,I=u.webnnIsGraphOutput;if(p!=="string"&&w&&I){let S=u.UTF8ToString(a);if(w(i,S)||I(i,S)){let E=Tt(p);_=kt(E,m),g="ml-tensor";let C=u.webnnCreateTemporaryTensor,A=u.webnnUploadTensor;if(!C||!A)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');let v=await C(i,E,m);A(v,new Uint8Array(x.buffer,x.byteOffset,x.byteLength)),y=v}else _=x.byteLength,y=u._malloc(_),r.push(y),u.HEAPU8.set(new Uint8Array(x.buffer,x.byteOffset,_),y)}else _=x.byteLength,y=u._malloc(_),r.push(y),u.HEAPU8.set(new Uint8Array(x.buffer,x.byteOffset,_),y)}}let $=u.stackSave(),T=u.stackAlloc(4*m.length);try{m.forEach((w,I)=>u.setValue(T+I*d,w,d===4?"i32":"i64"));let x=u._OrtCreateTensor(Tt(p),y,_,T,m.length,fa(g));x===0&&fe(`Can't create tensor for input/output. session=${i}, index=${n}.`),t.push(x)}finally{u.stackRestore($)}},en=async(e,t,r,i,a,n)=>{let s=ge(),u=s.PTR_SIZE,d=ht.get(e);if(!d)throw new Error(`cannot run inference. invalid session id: ${e}`);let p=d[0],m=d[1],h=d[2],g=d[3],y=d[4],_=d[5],$=t.length,T=i.length,x=0,w=[],I=[],S=[],E=[],C=[],A=s.stackSave(),v=s.stackAlloc($*u),U=s.stackAlloc($*u),q=s.stackAlloc(T*u),Y=s.stackAlloc(T*u);try{[x,w]=ap(n),It("wasm prepareInputOutputTensor");for(let D=0;D<$;D++)await da(r[D],I,E,e,m[t[D]],t[D],y);for(let D=0;D<T;D++)await da(a[D],S,E,e,h[i[D]],$+i[D],y);Et("wasm prepareInputOutputTensor");for(let D=0;D<$;D++)s.setValue(v+D*u,I[D],"*"),s.setValue(U+D*u,m[t[D]],"*");for(let D=0;D<T;D++)s.setValue(q+D*u,S[D],"*"),s.setValue(Y+D*u,h[i[D]],"*");if(g&&!_){let{handle:D,outputPreferredLocations:G,outputPreferredLocationsEncoded:ee}=g;if(m.length!==$)throw new Error(`input count from feeds (${$}) is expected to be always equal to model's input count (${m.length}).`);It("wasm bindInputsOutputs");for(let Z=0;Z<$;Z++){let X=t[Z];await s._OrtBindInput(D,m[X],I[Z])!==0&&fe(`Can't bind input[${Z}] for session=${e}.`)}for(let Z=0;Z<T;Z++){let X=i[Z];a[Z]?.[3]?(C.push(S[Z]),s._OrtBindOutput(D,h[X],S[Z],0)!==0&&fe(`Can't bind pre-allocated output[${Z}] for session=${e}.`)):s._OrtBindOutput(D,h[X],0,ee[X])!==0&&fe(`Can't bind output[${Z}] to ${G[Z]} for session=${e}.`)}Et("wasm bindInputsOutputs"),ht.set(e,[p,m,h,g,y,!0])}s.jsepOnRunStart?.(p),s.webnnOnRunStart?.(p);let H;g?H=await s._OrtRunWithBinding(p,g.handle,T,q,x):H=await s._OrtRun(p,U,v,$,Y,T,q,x),H!==0&&fe("failed to call OrtRun().");let Q=[],R=[];It("wasm ProcessOutputTensor");for(let D=0;D<T;D++){let G=Number(s.getValue(q+D*u,"*"));if(G===S[D]||C.includes(S[D])){Q.push(a[D]),G!==S[D]&&s._OrtReleaseTensor(G)!==0&&fe("Can't release tensor.");continue}let ee=s.stackSave(),Z=s.stackAlloc(4*u),X=!1,de,M=0;try{s._OrtGetTensorData(G,Z,Z+u,Z+2*u,Z+3*u)!==0&&fe(`Can't access output tensor data on index ${D}.`);let L=u===4?"i32":"i64",te=Number(s.getValue(Z,L));M=s.getValue(Z+u,"*");let oe=s.getValue(Z+u*2,"*"),Ae=Number(s.getValue(Z+u*3,L)),Oe=[];for(let xe=0;xe<Ae;xe++)Oe.push(Number(s.getValue(oe+xe*u,L)));s._OrtFree(oe)!==0&&fe("Can't free memory for tensor dims.");let Me=Oe.reduce((xe,_e)=>xe*_e,1);de=at(te);let st=g?.outputPreferredLocations[i[D]];if(de==="string"){if(st==="gpu-buffer"||st==="ml-tensor")throw new Error("String tensor is not supported on GPU.");let xe=[];for(let _e=0;_e<Me;_e++){let ze=s.getValue(M+_e*u,"*"),dr=s.getValue(M+(_e+1)*u,"*"),Ke=_e===Me-1?void 0:dr-ze;xe.push(s.UTF8ToString(ze,Ke))}Q.push([de,Oe,xe,"cpu"])}else if(st==="gpu-buffer"&&Me>0){let xe=s.jsepGetBuffer;if(!xe)throw new Error('preferredLocation "gpu-buffer" is not supported without using WebGPU.');let _e=xe(M),ze=kt(te,Me);if(ze===void 0||!Na(de))throw new Error(`Unsupported data type: ${de}`);X=!0,Q.push([de,Oe,{gpuBuffer:_e,download:s.jsepCreateDownloader(_e,ze,de),dispose:()=>{s._OrtReleaseTensor(G)!==0&&fe("Can't release tensor.")}},"gpu-buffer"])}else if(st==="ml-tensor"&&Me>0){let xe=s.webnnEnsureTensor,_e=s.webnnIsGraphInputOutputTypeSupported;if(!xe||!_e)throw new Error('preferredLocation "ml-tensor" is not supported without using WebNN.');if(kt(te,Me)===void 0||!Ma(de))throw new Error(`Unsupported data type: ${de}`);if(!_e(e,de,!1))throw new Error(`preferredLocation "ml-tensor" for ${de} output is not supported by current WebNN Context.`);let ze=await xe(e,M,te,Oe,!1);X=!0,Q.push([de,Oe,{mlTensor:ze,download:s.webnnCreateMLTensorDownloader(M,de),dispose:()=>{s.webnnReleaseTensorId(M),s._OrtReleaseTensor(G)}},"ml-tensor"])}else if(st==="ml-tensor-cpu-output"&&Me>0){let xe=s.webnnCreateMLTensorDownloader(M,de)(),_e=Q.length;X=!0,R.push((async()=>{let ze=[_e,await xe];return s.webnnReleaseTensorId(M),s._OrtReleaseTensor(G),ze})()),Q.push([de,Oe,[],"cpu"])}else{let xe=Fr(de),_e=new xe(Me);new Uint8Array(_e.buffer,_e.byteOffset,_e.byteLength).set(s.HEAPU8.subarray(M,M+_e.byteLength)),Q.push([de,Oe,_e,"cpu"])}}finally{s.stackRestore(ee),de==="string"&&M&&s._free(M),X||s._OrtReleaseTensor(G)}}g&&!y&&(s._OrtClearBoundOutputs(g.handle)!==0&&fe("Can't clear bound outputs."),ht.set(e,[p,m,h,g,y,!1]));for(let[D,G]of await Promise.all(R))Q[D][2]=G;return Et("wasm ProcessOutputTensor"),Q}finally{s.webnnOnRunEnd?.(p),s.stackRestore(A),I.forEach(H=>s._OrtReleaseTensor(H)),S.forEach(H=>s._OrtReleaseTensor(H)),E.forEach(H=>s._free(H)),x!==0&&s._OrtReleaseRunOptions(x),w.forEach(H=>s._free(H))}},tn=e=>{let t=ge(),r=ht.get(e);if(!r)throw new Error("invalid session id");let i=r[0],a=t._OrtEndProfiling(i);a===0&&fe("Can't get an profile file name."),t._OrtFree(a)},rn=e=>{let t=[];for(let r of e){let i=r[2];!Array.isArray(i)&&"buffer"in i&&t.push(i.buffer)}return t}}),ft,Ue,Mt,tr,rr,Br,pa,Nr,vt,xt,zd,nf,sf,of,uf,lf,df,pf,cf=P(()=>{Pe(),af(),Ot(),Oa(),ft=()=>!!we.wasm.proxy&&typeof document<"u",Mt=!1,tr=!1,rr=!1,Nr=new Map,vt=(e,t)=>{let r=Nr.get(e);r?r.push(t):Nr.set(e,[t])},xt=()=>{if(Mt||!tr||rr||!Ue)throw new Error("worker not ready")},zd=e=>{switch(e.data.type){case"init-wasm":Mt=!1,e.data.err?(rr=!0,pa[1](e.data.err)):(tr=!0,pa[0]()),Br&&(URL.revokeObjectURL(Br),Br=void 0);break;case"init-ep":case"copy-from":case"create":case"release":case"run":case"end-profiling":{let t=Nr.get(e.data.type);e.data.err?t.shift()[1](e.data.err):t.shift()[0](e.data.out);break}}},nf=async()=>{if(!tr){if(Mt)throw new Error("multiple calls to 'initWasm()' detected.");if(rr)throw new Error("previous call to 'initWasm()' failed.");if(Mt=!0,ft())return new Promise((e,t)=>{Ue?.terminate(),rp().then(([r,i])=>{try{Ue=i,Ue.onerror=n=>t(n),Ue.onmessage=zd,pa=[e,t];let a={type:"init-wasm",in:we};!a.in.wasm.wasmPaths&&(r||ha)&&(a.in.wasm.wasmPaths={wasm:new URL("/assets/ort-wasm-simd-threaded.jsep-6MnTkKum.wasm",import.meta.url).href}),Ue.postMessage(a),Br=r}catch(a){t(a)}},t)});try{await Ra(we.wasm),await Za(we),tr=!0}catch(e){throw rr=!0,e}finally{Mt=!1}}},sf=async e=>{if(ft())return xt(),new Promise((t,r)=>{vt("init-ep",[t,r]);let i={type:"init-ep",in:{epName:e,env:we}};Ue.postMessage(i)});await Ya(we,e)},of=async e=>ft()?(xt(),new Promise((t,r)=>{vt("copy-from",[t,r]);let i={type:"copy-from",in:{buffer:e}};Ue.postMessage(i,[e.buffer])})):Hr(e),uf=async(e,t)=>{if(ft()){if(t?.preferredOutputLocation)throw new Error('session option "preferredOutputLocation" is not supported for proxy.');return xt(),new Promise((r,i)=>{vt("create",[r,i]);let a={type:"create",in:{model:e,options:{...t}}},n=[];e instanceof Uint8Array&&n.push(e.buffer),Ue.postMessage(a,n)})}else return Xa(e,t)},lf=async e=>{if(ft())return xt(),new Promise((t,r)=>{vt("release",[t,r]);let i={type:"release",in:e};Ue.postMessage(i)});Ja(e)},df=async(e,t,r,i,a,n)=>{if(ft()){if(r.some(s=>s[3]!=="cpu"))throw new Error("input tensor on GPU is not supported for proxy.");if(a.some(s=>s))throw new Error("pre-allocated output tensor is not supported for proxy.");return xt(),new Promise((s,u)=>{vt("run",[s,u]);let d=r,p={type:"run",in:{sessionId:e,inputIndices:t,inputs:d,outputIndices:i,options:n}};Ue.postMessage(p,rn(d))})}else return en(e,t,r,i,a,n)},pf=async e=>{if(ft())return xt(),new Promise((t,r)=>{vt("end-profiling",[t,r]);let i={type:"end-profiling",in:e};Ue.postMessage(i)});tn(e)}}),ca,Cd,hf,Wy=P(()=>{Pe(),cf(),J(),Aa(),sp(),ca=(e,t)=>{switch(e.location){case"cpu":return[e.type,e.dims,e.data,"cpu"];case"gpu-buffer":return[e.type,e.dims,{gpuBuffer:e.gpuBuffer},"gpu-buffer"];case"ml-tensor":return[e.type,e.dims,{mlTensor:e.mlTensor},"ml-tensor"];default:throw new Error(`invalid data location: ${e.location} for ${t()}`)}},Cd=e=>{switch(e[3]){case"cpu":return new Je(e[0],e[2],e[1]);case"gpu-buffer":{let t=e[0];if(!Na(t))throw new Error(`not supported data type: ${t} for deserializing GPU tensor`);let{gpuBuffer:r,download:i,dispose:a}=e[2];return Je.fromGpuBuffer(r,{dataType:t,dims:e[1],download:i,dispose:a})}case"ml-tensor":{let t=e[0];if(!Ma(t))throw new Error(`not supported data type: ${t} for deserializing MLTensor tensor`);let{mlTensor:r,download:i,dispose:a}=e[2];return Je.fromMLTensor(r,{dataType:t,dims:e[1],download:i,dispose:a})}default:throw new Error(`invalid data location: ${e[3]}`)}},hf=class{async fetchModelAndCopyToWasmMemory(e){return of(await Da(e))}async loadModel(e,t){et();let r;typeof e=="string"?r=await this.fetchModelAndCopyToWasmMemory(e):r=e,[this.sessionId,this.inputNames,this.outputNames,this.inputMetadata,this.outputMetadata]=await uf(r,t),je()}async dispose(){return lf(this.sessionId)}async run(e,t,r){et();let i=[],a=[];Object.entries(e).forEach(h=>{let g=h[0],y=h[1],_=this.inputNames.indexOf(g);if(_===-1)throw new Error(`invalid input '${g}'`);i.push(y),a.push(_)});let n=[],s=[];Object.entries(t).forEach(h=>{let g=h[0],y=h[1],_=this.outputNames.indexOf(g);if(_===-1)throw new Error(`invalid output '${g}'`);n.push(y),s.push(_)});let u=i.map((h,g)=>ca(h,()=>`input "${this.inputNames[a[g]]}"`)),d=n.map((h,g)=>h?ca(h,()=>`output "${this.outputNames[s[g]]}"`):null),p=await df(this.sessionId,a,u,s,d,r),m={};for(let h=0;h<p.length;h++)m[this.outputNames[s[h]]]=n[h]??Cd(p[h]);return je(),m}startProfiling(){}endProfiling(){pf(this.sessionId)}}}),ff={};Wt(ff,{OnnxruntimeWebAssemblyBackend:()=>Ea,initializeFlags:()=>Ia,wasmBackend:()=>mf});var Ia,Ea,mf,Ly=P(()=>{Pe(),cf(),Wy(),Ia=()=>{(typeof we.wasm.initTimeout!="number"||we.wasm.initTimeout<0)&&(we.wasm.initTimeout=0);let e=we.wasm.simd;if(typeof e!="boolean"&&e!==void 0&&e!=="fixed"&&e!=="relaxed"&&(console.warn(`Property "env.wasm.simd" is set to unknown value "${e}". Reset it to \`false\` and ignore SIMD feature checking.`),we.wasm.simd=!1),typeof we.wasm.proxy!="boolean"&&(we.wasm.proxy=!1),typeof we.wasm.trace!="boolean"&&(we.wasm.trace=!1),typeof we.wasm.numThreads!="number"||!Number.isInteger(we.wasm.numThreads)||we.wasm.numThreads<=0)if(typeof self<"u"&&!self.crossOriginIsolated)we.wasm.numThreads=1;else{let t=typeof navigator>"u"?Eg("node:os").cpus().length:navigator.hardwareConcurrency;we.wasm.numThreads=Math.min(4,Math.ceil((t||1)/2))}},Ea=class{async init(e){Ia(),await nf(),await sf(e)}async createInferenceSessionHandler(e,t){let r=new hf;return await r.loadModel(e,t),r}},mf=new Ea});Pe();Pe();Pe();var Vy="1.24.1",Gy=Zd;{let e=(Ly(),ur(ff)).wasmBackend;Dt("webgpu",e,5),Dt("webnn",e,5),Dt("cpu",e,10),Dt("wasm",e,10)}Object.defineProperty(we.versions,"web",{value:Vy,enumerable:!0});export{Qd as InferenceSession,Ur as TRACE,It as TRACE_EVENT_BEGIN,Et as TRACE_EVENT_END,et as TRACE_FUNC_BEGIN,je as TRACE_FUNC_END,Je as Tensor,Gy as default,we as env,Dt as registerBackend};
