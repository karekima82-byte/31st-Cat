import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {parseManuscript} from '../core.js';
const path=process.argv[2];if(!path)throw Error('npm run import -- 完成稿.md');
const bytes=await readFile(path),source=bytes.toString('utf8'),sections=parseManuscript(source);
await mkdir(new URL('../source/',import.meta.url),{recursive:true});
await writeFile(new URL('../source/RETRACE_三十一匹目の猫_完成稿.md',import.meta.url),bytes);
await writeFile(new URL('../data/manuscript.json',import.meta.url),JSON.stringify({sourceHash:createHash('sha256').update(bytes).digest('hex'),sections},null,2));
console.log(`8節を取り込みました。${sections.reduce((n,s)=>n+s.beats.length,0)}段落。原稿の原本とSHA256を保存。`);
