var diveSync = require("diveSync"),
    noddocco = require("noddocco"),
    path = require('path'),
    fs = require('fs'),
    dust = require('dustjs-helpers'),
    ncp = require('ncp').ncp,
    marked = require('marked'),
    hl = require('highlight.js');

marked.setOptions({
  gfm: true,
  pedantic: false,
  sanitize: false,
  // callback for code highlighter
  highlight: function(code, lang) {
    if(lang === undefined) return code;
    return hl.highlight(lang, code).value;
  }
});

// load all dust templates
var template,
    templateDir = path.join(__dirname, 'templates'),
    templates = fs.readdirSync(templateDir);

for (var i in templates){
  template = templates[i];
  if(path.extname(template) != '.dust') continue;
  templateName = path.basename(template, '.dust');
  dust.loadSource(dust.compile(
    fs.readFileSync(path.join(templateDir, template), 'utf8'),
    templateName
  ));
}

var blocks = {}, pages = {}, sections = {}, files = [],
    dir, target, fileRepo, key, comment, page, details, ext, input, foundsection;

function anchorize(match, p1, p2, offset, string){
  return '<h'+p1+' id="'+key+'-s'+(foundsection++)+'" class="section md">'+p2+'</h'+p1+'>';
}

module.exports = function(config) {

  var opt = {
    recursive: true,
    all: config.hidden,
    directories: false,
    filter: function filter(node, dir) {
      if(node.indexOf('.git') != -1) return false;
      for(var i in config.ignore){
        if(node.indexOf(config.ignore[i]) != -1) return false;
      }
      if(dir) return true;
      for(var i in config.include){
        if(path.extname(node).slice(1) == config.include[i]) return true;
      }
      return false;
    }
  }

  // copy over assets
  if(!fs.existsSync(config.output)) fs.mkdirSync(config.output);
  ncp(path.join(__dirname, 'assets'), path.join(config.output, 'assets'), function (err) {
    if (err) console.log(err);
  });

  diveSync(process.cwd(), opt, function(err, file) {
    if (err) throw err;
    ext = path.extname(file).slice(1);
    input = fs.readFileSync(file, 'utf8');
    fileRepo = path.relative(process.cwd(), file);
    key = fileRepo.replace(/\//g, "_").replace(/\./g, "_").toLowerCase();
    dir = path.dirname(path.relative(process.cwd(), file)).toLowerCase();
    if (dir === '.') dir = '';
    dir = dir + '/';
    files.push({
      file: path.basename(path.relative(process.cwd(), file)),
      dir: dir,
      key: key
    });
    if(ext == 'md'){
      foundsection = 1;
      var i = 1;
      input = marked(input);
      page = input.match(/<h([1-3])>(.*)<\/h[1-3]>/gi);
      for(var j in page){
          sections[key] = sections[key] || [];
          details = {
              page: page[j].match(/<h[1-3]>(.*)<\/h[1-3]>/)[1],
              section: i++,
              h: page[j].match(/<h([1-3])>/)[1],
              key: key
          };
          sections[key].push(details);
          pages[key] = pages[key] || [];
            pages[key].push(details);
        }
      var content = input.replace(/<h([1-3])>(.*)<\/h[1-3]>/gi, anchorize);
      blocks[key] = {
        md: true,
        file: file,
        fileRepo: fileRepo,
        key: key,
        block: content
      };
    } else {
      noddocco.process(input, ext, config.ctypes, false, function (err, noddoccoData) {
        blocks[key] = {
          file: file,
          fileRepo: fileRepo,
          key: key,
          blocks: noddoccoData
        };
        // pick out the h1-h3 headings in the file to display as "sections" and "pages"
        for (var i in noddoccoData){
          comment = noddoccoData[i].comments;
          page = comment.match(/<h([1-3])>(.*)<\/h[1-3]>/i);
          if(page) {
            sections[key] = sections[key] || [];
            details = {
                page: page[2],
                section: (+i + 1),
                h: page[1],
                key: key
            };
            sections[key].push(details);
            pages[key] = pages[key] || [];
            pages[key].push(details);
          }
        }
      });
    }
  });

  var displaypages = [];
  var orderedblocks = [];

  if (config.order) {
    //console.log('story mode');
    for (var i in config.order){
      orderedblocks.push(blocks[config.order[i]]);
      for (var j in pages[config.order[i]]){
        displaypages.push(pages[config.order[i]][j]);
      }
      delete pages[config.order[i]];
    }
    for (var i in pages){
      orderedblocks.push(blocks[pages[i][0].key]);
      for (var j in pages[i]){
        displaypages.push(pages[i][j]);
      }
    }
  } else {
    for(var i in pages){
      orderedblocks.push(blocks[pages[i][0].key]);
      for (var j in pages[i]){
        displaypages.push(pages[i][j]);
      }
    }
  }

  //console.log(pages);
  //render a page for each block of noddocco data
  console.log('writing...');
  config.project = config.project || 'dockit generated docs';
  var all = [],
      dest,
      generated = new Date();
  for (var i in blocks){
    dest = blocks[i].key;

    dust.render('file', {
      md: blocks[i].md,
      title: config.project,
      github: config.github,
      showall: config.all,
      current: blocks[i].key,
      files: files,
      generated: generated,
      pages: displaypages,
      //sections: sections[blocks[i].key],
      data: blocks[i]},
      function(err, output){
        if(dest == 'readme_md'){
          fs.writeFileSync(path.join(config.output,'index.html'), output);
        }
        fs.writeFileSync(path.join(config.output, dest + '.html'), output);
        console.log(path.join(config.output, dest));
    })

    all.push(blocks[i]);
  }

  //console.log(orderedblocks);
  if(config.all) {
    dest = 'all.html';
    dust.render('file', {
      all: true,
      title: config.project,
      github: config.github,
      showall: config.all,
      files: files,
      generated: generated,
      pages: displaypages,
      //sections: sections[blocks[i].key],
      data: orderedblocks},
      function(err, output){
        fs.writeFileSync(path.join(config.output, dest), output);
        console.log(path.join(config.output, dest));
    })
  }
  console.log('...done!');
}

















