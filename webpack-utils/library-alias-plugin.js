class LibraryAliasPlugin {
  constructor(alias) {
    this.alias = alias;
  }

  apply(compiler) {
    const self = this;

    compiler.hooks.emit.tapPromise('libraryAliasPlugin', (compilation) => {
      return new Promise((resolve, reject) => {
        try {
          const alias = self.alias;
          const libName = compiler.options.output.library;

          compilation.chunks.forEach((chunk) => {
            chunk.files.forEach((filename) => {
              const source = compilation.assets[filename].source();

              compilation.assets[filename].source = () =>
                `${source}\nvar ${alias}=${libName};`;
            });
          });

          resolve();
        } catch (e) {
          compilation.errors.push(e);
          resolve();
        }
      });
    });
  }
}

module.exports = LibraryAliasPlugin;
