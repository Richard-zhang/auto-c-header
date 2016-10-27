'use babel';

import AutoCHeaderView from './auto-c-header-view';
import { CompositeDisposable } from 'atom';

export default {

  autoCHeaderView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.autoCHeaderView = new AutoCHeaderView(state.autoCHeaderViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.autoCHeaderView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'auto-c-header:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.autoCHeaderView.destroy();
  },

  serialize() {
    return {
      autoCHeaderViewState: this.autoCHeaderView.serialize()
    };
  },

  toggle() {
    // TODO when the header file exists, don't rewrite the file
    // TODO Support for basic data structure and global variable
    // TODO report error
    // TODO support for C++ syntax 
    let editor;
    if(editor = atom.workspace.getActiveTextEditor()) {
        let title = editor.getTitle()
        let filename = title.substr(0, title.lastIndexOf('.'))
        let extension = title.substr(title.lastIndexOf('.')+1);

        if (filename && extension && (extension === 'cpp' || extension === 'c')) {
            let header = '';
            const str = editor.getText();

            //handle the macro and include
            var lines = str.split('\n');
            for (let i = 0; i < lines.length; i++) {
                if(lines[i][0] == '#') {
                    header+=lines[i]+'\n';
                } else {
                    break;
                }
            }

            header += '\n';
            // handle the function definition
            const regex = /(\w+\s+(\w+)\s*\(([\w\s,<>\[\].=&':/*]*?)\)\s*(const)?\s*(?={))/g;
            let m;
            while((m = regex.exec(str)) != null) {
                let lastIndex = m[0].lastIndexOf(')');
                header += m[0].substr(0, lastIndex+1) + ';\n';
            }

            // extract path
            let path = /^.*\//g.exec(editor.getPath())[0];
            let newFilename = filename.concat((extension === 'cpp') ? '.hpp' : '.h');
            let newFilenameWithPath = path+newFilename;


            // replace old include
            editor.setCursorScreenPosition([0,0]);
            editor.selectLinesContainingCursors();
            editor.insertText('#include \"'+newFilename + '\"\n');

            let i = 1;
            while(i < 100) {
                editor.setCursorScreenPosition([i,0]);
                console.log(editor.getWordUnderCursor());
                if(editor.getWordUnderCursor() == '#') {
                    editor.deleteLine();
                } else {
                    break;
                }
                i++;
            }

            // create a new file
            let newEditor = atom.workspace.buildTextEditor();
            newEditor.insertText(header);
            newEditor.saveAs(newFilenameWithPath);
        } else {
            console.log('format not supported')
        }
    }
  }

};
