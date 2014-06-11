'use strict';
// ## Dockit Lib
// Require the necessary libraries.
// Actual file parsing for code and comments is handled by the [noddocco](https://github.com/diffsky/noddocco) lib.
//
//
//
// A marked instance is configured tp parse strings as markdown
// using github flavored markdown, passing code highlight
// callbacks to `highlight.js`
//
// A Dust instance is configured and templates loaded and compiled to be used to generate HTML files.
//
// All templates from `templates` directory are compiled into the `dust.cache` via [duster](https://github.com/diffsky/noddocco)
// - preserving any whitespace in the templates by using a format optimizer.

var noddocco = require('noddocco');
var path = require('path');
var fs = require('fs');
var ncp = require('ncp').ncp;
var hl = require('highlight.js');
var expand = require('glob-expand');
var mkdirp = require('mkdirp');

var ejstpl = require('ejstpl');
var tpl = ejstpl({
  cwd: path.join(__dirname, 'templates')
});

/* dockit note version 0.2.10 started automatically addings id attributes to headings which broke dockit's parsing */
var marked = require('marked');
marked.setOptions({
  gfm: true,
  pedantic: false,
  sanitize: false,
  highlight: function(code, lang) {
    if (lang === undefined) {
      return code;
    }
    return hl.highlight(lang, code).value;
  }
});

// ### Process files and generate documentation
// A config object passed to the dockit function contains a glob match for all the
// files to be processed. These matches can be split into sections allowing for finer control
// over the order in which files are processed and then displayed.
//
// For each file in the match, it's name is used to generate a *key* that will
// serve as the genrated filename (with directory slashes replaced with dashes).
//
// Any markdown files are treated as a special case - with `h1`, `h2` and `h3` headings extracted
// to be added to the pages navigation. The headings are *anchorized* so that scrollspy
// can capture them clientside and update the pages and files navigation.
//
// Other files are passed to `noddocco` to be processed, with returns an object with
// comment and code properties for the parsed file. The comment section is checked for
// any `h1`, `h2` and `h3` headings (as above) to be added to the pages navigation.
var blocks = {},
  pages = {},
  files = [],
  dir, fileRepo, key, comment, page, details, ext, input, foundsection;

function anchorize(match, p1, p2, offset, string) {
  return '</div><div id="' + key + '-s' + (foundsection++) + '" class="section md"><h' + p1 + '>' + p2 + '</h' + p1 + '>';
}

module.exports = function(config) {
  var opts = {},
    owd = process.cwd();

  if (!fs.existsSync(config.outputAbsolute)) {
    mkdirp.sync(config.outputAbsolute);
  }
  ncp(path.join(__dirname, 'assets'), path.join(config.outputAbsolute, '__assets'), function(err) {
    if (err) {
      console.log(err);
    }
  });
  var matches = [];
  process.chdir(config.configDir);
  for (var section in config.files) {
    expand({
      filter: 'isFile'
    }, config.files[section]).forEach(function(f) {
      matches.push(path.join(config.configDir, f));
    });
  }
  process.chdir(owd);

  config.assets = config.assets || [];
  config.assets.forEach(function(asset) {
    ncp(path.join(config.configDir, asset), path.join(config.outputAbsolute, '__assets', path.basename(asset)), function(err) {
      if (err) {
        console.log(err);
      }
    });
  });

  matches.forEach(function(file) {
    ext = path.extname(file).slice(1);
    input = fs.readFileSync(file, 'utf8');
    fileRepo = path.relative(process.cwd(), file);
    key = fileRepo.replace(/\//g, '_').replace(/\./g, '_').toLowerCase();
    dir = path.dirname(path.relative(process.cwd(), file)).toLowerCase();
    if (dir === '.') {
      dir = '';
    }
    dir = dir + '/';
    files.push({
      file: path.basename(path.relative(process.cwd(), file)),
      dir: dir,
      key: key
    });
    if (ext === 'md') {
      foundsection = 1;
      var i = 1;
      input = marked(input);
      page = input.match(/<h([1-3])>(.*)<\/h[1-3]>/gi);
      for (var j in page) {
        details = {
          page: page[j].match(/<h[1-3]>(.*)<\/h[1-3]>/)[1],
          section: i++,
          h: page[j].match(/<h([1-3])>/)[1],
          key: key
        };
        pages[key] = pages[key] || [];
        pages[key].push(details);
      }

      var content = '<div>' + input.replace(/<h([1-3])>(.*)<\/h[1-3]>/gi, anchorize) + '</div>';
      blocks[key] = {
        md: true,
        file: file,
        fileRepo: fileRepo,
        key: key,
        block: content
      };
    } else {
      opts.ext = ext;
      opts.ctypes = config.ctypes;
      opts.encode = false;
      opts.ignores = config.ignores || {};
      noddocco.process(input, opts, function(err, noddoccoData) {
        if (err) {
          console.log(err);
        } else {
          blocks[key] = {
            file: file,
            fileRepo: fileRepo,
            key: key,
            blocks: noddoccoData
          };
          for (var i in noddoccoData) {
            comment = noddoccoData[i].comments;
            page = comment.match(/<h([1-3])>(.*)<\/h[1-3]>/i);
            if (page) {
              details = {
                page: page[2],
                section: (+i + 1),
                h: page[1],
                key: key
              };
              pages[key] = pages[key] || [];
              pages[key].push(details);
            }
          }
        }
      });
    }
  });

  // ### Write the documentation to disk
  // With the noddocco data generated for each file. Loop through the files and
  // write their contents to disk.
  //
  // By default, alongised individual file pages, Dockit will create a page which is all
  // the files processed into one, long html page. This page will be the `index.html`
  // This behaviour can be altered by the dockit configuration
  //
  // As the files are written to disk the progress is sent to the console.
  var displaypages = [];
  var orderedblocks = [];

  for (var i in pages) {
    orderedblocks.push(blocks[pages[i][0].key]);
    for (var j in pages[i]) {
      displaypages.push(pages[i][j]);
    }
  }

  console.log('writing...');
  config.project = config.project || 'dockit generated docs';
  var all, dest, data, output,
    generated = new Date();

  all = 'all.html';
  if (config.index === 'all.html') {
    config.index = 'index.html';
    all = 'index.html';
  }

  for (i in blocks) {
    dest = blocks[i].key + '.html';
    data = {
      onAll: false,
      md: blocks[i].md || false,
      title: config.project,
      index: config.index,
      github: config.github,
      showall: config.all,
      all: all,
      allHash: config.allHash,
      current: blocks[i].key,
      files: files,
      favicon: config.favicon,
      generated: generated,
      pages: displaypages,
      data: [blocks[i]]
    };
    output = tpl.main(data);
    if (dest === config.index) {
      dest = 'index.html';
    } else if (dest.slice(0, 6) === 'readme') {
      fs.writeFileSync(path.join(config.outputAbsolute, 'index.html'), output);
    }
    fs.writeFileSync(path.join(config.outputAbsolute, dest), output);
    console.log(path.join(config.outputAbsolute, dest));
  }

  if (config.all) {
    data = {
      all: all,
      md: false,
      allHash: config.allHash,
      onAll: true,
      title: config.project,
      index: config.index,
      github: config.github,
      showall: config.all,
      files: files,
      favicon: config.favicon,
      generated: generated,
      pages: displaypages,
      data: orderedblocks
    };
    output = tpl.main(data);
    fs.writeFileSync(path.join(config.outputAbsolute, all), output);
    console.log(path.join(config.output, all));
  }

  console.log('...done!');
};
