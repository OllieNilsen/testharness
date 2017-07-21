const Promise = require('bluebird');
const R = require('ramda');
// const state = require('./state');
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
  let storagePath = `./db/${p}`;
  return storagePath.split('/').join(sep);
}

function _strip(path) {
  return path.split(sep).slice(2).join(sep);
}

function _readRecursive(path) {
  fs.readdirSync(path).forEach((file) => {
    const curPath = `${path}/${file}`;
    if (fs.lstatSync(curPath).isDirectory()) {
      return _readRecursive.call(this, curPath);
    }
    return this.addItemToState(curPath);
  })
}

class Storage {

  constructor() {
    this.state = {};
    if (fs.existsSync('./db')) {
      console.log('......... Previous data detected ...........');
      console.log(' - loading state...');
      return _readRecursive.call(this, './db');
    } else {
      console.log('......... No previous data detected ...........');
      console.log(' - starting with empty state.');
    }
  }

  addItemToState(pathToItem) {
    const strippedPath = _strip(pathToItem);
    const lens = R.lensPath(strippedPath.split(sep));
    this.state = R.set(lens, JSON.parse(fs.readFileSync(pathToItem).toString('utf8')), this.state);
  }

  removeItemFromState(pathToItem) {
    const strippedPath = _strip(pathToItem);
    this.state = R.dissocPath(strippedPath.split(sep), this.state);
  }

  getItem(pathToItem) {
    return readFile(_formatPath(pathToItem))
      .then(buffer => buffer.toString('utf8'))
      .tap(console.log)
      .then(JSON.parse)
      .catch(console.log)
  }

  putItem(pathToItem, data) {
    const formattedPath = _formatPath(pathToItem);
    return _ensureDirExists(path.dirname(formattedPath))
      .then(() => writeFile(formattedPath, JSON.stringify(data)))
      .then(() => this.addItemToState(formattedPath));
  }

  scan(pathToDir) {
    const formattedPath = _formatPath(pathToDir);
    return readdir(formattedPath)
      .then(files => Promise.map(files, f => readFile(path.join(formattedPath, f))))
      .then(R.map(buffer => JSON.parse(buffer.toString('utf8'))))
      .catch(console.log)
  }

  deleteItem(pathToItem) {
    const formattedPath = _formatPath(pathToItem);
    return unlink(formattedPath)
      .then(() => this.removeItemFromState(formattedPath))
  }
}

module.exports = new Storage();