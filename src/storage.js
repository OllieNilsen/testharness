const Promise = require('bluebird');
const R = require('ramda');
const state = require('./state');
const fs = require('fs');
const readFile = Promise.promisify(fs.readFile, { context: fs });
const writeFile = Promise.promisify(fs.writeFile, { context: fs });
const readdir = Promise.promisify(fs.readdir, { context: fs });
const unlink = Promise.promisify(fs.unlink, { context: fs });
const path = require('path');
const sep = path.sep;

function _ensureDirExists(pathToDir) {
  const initDir = path.isAbsolute(pathToDir) ? sep : '';

  return new Promise(resolve => {
    resolve(pathToDir.split(sep).reduce((parentDir, childDir) => {
      const curDir = path.resolve(parentDir, childDir);
      if (!fs.existsSync(curDir)) {
        fs.mkdirSync(curDir);
      }

      return curDir;
    }, initDir));
  });

}

function _formatPath(p) {
  let storagePath = `./storage/${p}`;
  return storagePath.split('/').join(sep);
}

class Storage {

  getItem(pathToItem) {
    return readFile(_formatPath(pathToItem))
      .then(buf => buf.toString('utf8'))
      .then(s => JSON.parse(s))
      .catch(console.log)
  }

  putItem(pathToItem, data) {
    const formattedPath = _formatPath(pathToItem);
    return _ensureDirExists(path.dirname(formattedPath))
      .then(() => writeFile(formattedPath, JSON.stringify(data)))
  }

  scan(pathToDir) {
    const formattedPath = _formatPath(pathToDir);
    return readdir(formattedPath)
      .then(files => Promise.map(files, f => readFile(path.join(formattedPath, f))))
      .then(R.map(buffer => JSON.parse(buffer.toString('utf8'))))
      .catch(console.log)
  }

  deleteItem(pathToItem) {
    return unlink(_formatPath(pathToItem));
  }
}

module.exports = new Storage();