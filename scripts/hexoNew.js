var spawn = require('child_process').exec;

// Hexo 3 用户复制这段
hexo.on('new', function(data){
  spawn('start  "E:\Microsoft VS Code\Code.exe" ' + data.path);
});