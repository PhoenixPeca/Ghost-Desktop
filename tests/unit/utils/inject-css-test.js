import {injectCss} from 'ghost-desktop/utils/inject-css';
import {module, test} from 'qunit';

let insertCSScalled = false;
let fsCalled = false;
let encodingIsUtf = false;
let hasCallback = false;
let hasFilename = false;

const webviewShim = {
    insertCSS(css) {
        if (css && css === 'body { background-color: red;}') {
            insertCSScalled = true;
        }
    }
};
const fsShim = {
    readFile(file, encoding, callback) {
        fsCalled = true;

        if (file) {
            hasFilename = true;
        }

        if (encoding === 'utf8') {
            encodingIsUtf = true;
        }

        if (callback && typeof callback === 'function') {
            hasCallback = true;
        }

        callback(null, 'body { background-color: red;}');
    }
};
const requireNodeShim = function (target) {
    if (target === 'fs') {
        return fsShim;
    } else {
        return window.originalRequireNode(target);
    }
};

module('Unit | Utility | inject css', {
    beforeEach() {
        window.originalRequireNode = window.requireNode;
        window.requireNode = requireNodeShim;

        insertCSScalled = false;
        fsCalled = false;
        encodingIsUtf = false;
        hasCallback = false;
        hasFilename = false;
    },

    afterEach() {
        window.requireNode = window.originalRequireNode;
    }
});

test('properly uses fs to read css file', function(assert) {
    assert.expect(4);
    injectCss(webviewShim, 'testfile');

    assert.ok(encodingIsUtf);
    assert.ok(hasCallback);
    assert.ok(hasFilename);
    assert.ok(fsCalled);
});

test('attempts to inject css into webview', function(assert) {
    injectCss(webviewShim, 'testfile');

    assert.ok(insertCSScalled);
});

test('does not attempt injection if the source is not found', function(assert) {
    const oldReadFile = fsShim.readFile;

    fsShim.readFile = function (file, encoding, callback) {
        callback({error: 'oh noes'});
    };

    injectCss(webviewShim, 'testfile');

    assert.equal(insertCSScalled, false);
    fsShim.readFile = oldReadFile;
});
