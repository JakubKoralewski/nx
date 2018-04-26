import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { Tree, VirtualTree } from '@angular-devkit/schematics';
import { createEmptyWorkspace } from '../../utils/testing-utils';
import { getFileContent } from '@schematics/angular/utility/test';
import * as stripJsonComments from 'strip-json-comments';
import { readJsonInTree } from '../../utils/ast-utils';

describe('app', () => {
  const schematicRunner = new SchematicTestRunner(
    '@nrwl/schematics',
    path.join(__dirname, '../../collection.json')
  );

  let appTree: Tree;

  beforeEach(() => {
    appTree = new VirtualTree();
    appTree = createEmptyWorkspace(appTree);
  });

  describe('not nested', () => {
    it('should update angular.json', () => {
      const tree = schematicRunner.runSchematic(
        'app',
        { name: 'myApp' },
        appTree
      );
      const angularJson = readJsonInTree(tree, '/angular.json');

      expect(angularJson.projects['my-app'].root).toEqual('apps/my-app/');
      expect(angularJson.projects['my-app-e2e'].root).toEqual(
        'apps/my-app-e2e/'
      );
    });

    it('should update nx.json', () => {
      const tree = schematicRunner.runSchematic(
        'app',
        { name: 'myApp', tags: 'one,two' },
        appTree
      );
      const nxJson = readJsonInTree(tree, '/nx.json');
      expect(nxJson).toEqual({
        npmScope: 'proj',
        projects: {
          'my-app': {
            tags: ['one', 'two']
          },
          'my-app-e2e': {
            tags: []
          }
        }
      });
    });

    it('should generate files', () => {
      const tree = schematicRunner.runSchematic(
        'app',
        { name: 'myApp' },
        appTree
      );
      expect(tree.exists('apps/my-app/src/main.ts')).toBeTruthy();
      expect(tree.exists('apps/my-app/src/app/app.module.ts')).toBeTruthy();
      expect(tree.exists('apps/my-app/src/app/app.component.ts')).toBeTruthy();
      expect(
        getFileContent(tree, 'apps/my-app/src/app/app.module.ts')
      ).toContain('class AppModule');

      const tsconfigApp = JSON.parse(
        stripJsonComments(getFileContent(tree, 'apps/my-app/tsconfig.app.json'))
      );
      expect(tsconfigApp.compilerOptions.outDir).toEqual(
        '../../dist/out-tsc/apps/my-app'
      );
      expect(tsconfigApp.extends).toEqual('../../tsconfig.json');

      const tslintJson = JSON.parse(
        stripJsonComments(getFileContent(tree, 'apps/my-app/tslint.json'))
      );
      expect(tslintJson.extends).toEqual('../../tslint.json');

      expect(tree.exists('apps/my-app-e2e/src/app.po.ts')).toBeTruthy();
      const tsconfigE2E = JSON.parse(
        stripJsonComments(
          getFileContent(tree, 'apps/my-app-e2e/tsconfig.e2e.json')
        )
      );
      expect(tsconfigE2E.compilerOptions.outDir).toEqual(
        '../../dist/out-tsc/apps/my-app-e2e'
      );
      expect(tsconfigE2E.extends).toEqual('../../tsconfig.json');
    });
  });

  describe('nested', () => {
    it('should update angular.json', () => {
      const tree = schematicRunner.runSchematic(
        'app',
        { name: 'myApp', directory: 'myDir' },
        appTree
      );
      const angularJson = readJsonInTree(tree, '/angular.json');

      expect(angularJson.projects['my-dir-my-app'].root).toEqual(
        'apps/my-dir/my-app/'
      );
      expect(angularJson.projects['my-dir-my-app-e2e'].root).toEqual(
        'apps/my-dir/my-app-e2e/'
      );
    });

    it('should update nx.json', () => {
      const tree = schematicRunner.runSchematic(
        'app',
        { name: 'myApp', directory: 'myDir', tags: 'one,two' },
        appTree
      );
      const nxJson = readJsonInTree(tree, '/nx.json');
      expect(nxJson).toEqual({
        npmScope: 'proj',
        projects: {
          'my-dir-my-app': {
            tags: ['one', 'two']
          },
          'my-dir-my-app-e2e': {
            tags: []
          }
        }
      });
    });

    it('should generate files', () => {
      const tree = schematicRunner.runSchematic(
        'app',
        { name: 'myApp', directory: 'myDir' },
        appTree
      );
      expect(tree.exists('apps/my-dir/my-app/src/main.ts')).toBeTruthy();
      expect(
        tree.exists('apps/my-dir/my-app/src/app/app.module.ts')
      ).toBeTruthy();
      expect(
        tree.exists('apps/my-dir/my-app/src/app/app.component.ts')
      ).toBeTruthy();
      expect(
        getFileContent(tree, 'apps/my-dir/my-app/src/app/app.module.ts')
      ).toContain('class AppModule');

      const tsconfigApp = JSON.parse(
        stripJsonComments(
          getFileContent(tree, 'apps/my-dir/my-app/tsconfig.app.json')
        )
      );
      expect(tsconfigApp.compilerOptions.outDir).toEqual(
        '../../../dist/out-tsc/apps/my-dir/my-app'
      );

      const tslintJson = JSON.parse(
        stripJsonComments(
          getFileContent(tree, 'apps/my-dir/my-app/tslint.json')
        )
      );
      expect(tslintJson.extends).toEqual('../../../tslint.json');

      expect(tree.exists('apps/my-dir/my-app-e2e/src/app.po.ts')).toBeTruthy();
      const tsconfigE2E = JSON.parse(
        stripJsonComments(
          getFileContent(tree, 'apps/my-dir/my-app-e2e/tsconfig.e2e.json')
        )
      );
      expect(tsconfigE2E.compilerOptions.outDir).toEqual(
        '../../../dist/out-tsc/apps/my-dir/my-app-e2e'
      );
    });
  });

  it('should import NgModule', () => {
    const tree = schematicRunner.runSchematic(
      'app',
      { name: 'myApp', directory: 'myDir' },
      appTree
    );
    expect(
      getFileContent(tree, 'apps/my-dir/my-app/src/app/app.module.ts')
    ).toContain('NxModule.forRoot()');
  });

  describe('routing', () => {
    it('should include RouterTestingModule', () => {
      const tree = schematicRunner.runSchematic(
        'app',
        { name: 'myApp', directory: 'myDir', routing: true },
        appTree
      );
      expect(
        getFileContent(tree, 'apps/my-dir/my-app/src/app/app.module.ts')
      ).toContain('RouterModule.forRoot');
      expect(
        getFileContent(tree, 'apps/my-dir/my-app/src/app/app.component.spec.ts')
      ).toContain('imports: [RouterTestingModule]');
    });
  });
});
