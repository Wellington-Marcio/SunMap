const { execSync } = require('child_process');
function run(cmd){
  console.log('>',cmd);
  try{
    const out = execSync(cmd,{stdio:'pipe'}).toString();
    console.log(out);
  }catch(e){
    console.error('ERR',e.status,e.message);
    if(e.stdout) console.log(e.stdout.toString());
    if(e.stderr) console.error(e.stderr.toString());
    process.exit(e.status||1);
  }
}
run('git rev-parse --is-inside-work-tree');
run('git status --porcelain -uall');
run('git add -A');
run('git status --porcelain -uall');
run('git commit -m "chore(backend): restore source files and Dockerfile"');
run('git rev-parse --abbrev-ref HEAD');
run('git push -u origin HEAD');
console.log('Done');
