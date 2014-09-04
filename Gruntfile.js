module.exports = function(grunt) {

	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-env');

	grunt.registerTask('build:schemas', ['copy:schemas']);
	grunt.registerTask('build:server', ['build:schemas', 'copy:server','copy:templates','copy:ssl', 'copy:sharedJsServer']);
	grunt.registerTask('build:client', ['build:schemas', 'copy:html','copy:htmlpartials', 'copy:css', 'copy:js', 'copy:img', 'copy:fonts', 'copy:sharedJsClient']);

	grunt.registerTask('build', ['clean:build', 'build:client', 'copy:bower', 'build:server', 'build:schemas']);
	grunt.registerTask('test', ['env:test', 'build', 'mochaTest:unitServer', 'mochaTest:unitShared']);
	grunt.registerTask('unitTest', ['env:test', 'build', 'mochaTest:unitServer', 'mochaTest:unitShared']);
	grunt.registerTask('integrationTest', ['env:test', 'build', 'mochaTest:integration']);

	grunt.renameTask('clean', '_clean');
	grunt.registerTask('clean', ['_clean:build']);
	grunt.registerTask('mrpropper', ['clean', '_clean:node_modules', '_clean:bower_components']);

	grunt.registerTask('default', ['build', 'unitTest']);

	grunt.initConfig({
		copy: {
			html: {
				files: [
					{expand: true, cwd: 'src/client/html', src: ['**'], dest: 'build/client/'}
				]
			},
			
			htmlpartials: {
				files: [
					{expand: true, cwd: 'src/client/partials', src: ['**'], dest: 'build/client/partials'}
				]
			},
			
			css: {
				files: [
					{expand: true, cwd: 'src/client/css', src: ['**'], dest: 'build/client/css/'}
				]
			},
			js: {
				files: [
					{expand: true, cwd: 'src/client/js', src: ['**'], dest: 'build/client/js'}
				]
			},
			img: {
				files: [
					{expand: true, cwd: 'src/client/img', src: ['**'], dest: 'build/client/img'}
				]
			},
			fonts: {
				files: [
					{expand: true, cwd: 'src/client/fonts', src: ['**'], dest: 'build/client/fonts'}
				]
			},
			bower: {
				files: [
					{expand: true, cwd: 'bower_components', src: ['**'], dest: 'build/client/lib/'}
				]
			},
			server: {
				files: [
					{expand: true, cwd: 'src/server', src: ['**'], dest: 'build/server/'}
				]
			},
			templates: {
				files: [
					{expand: true, cwd: 'src/server/templates', src: ['**'], dest: 'build/server/templates'}
				]
			},
			ssl: {
				files: [
					{expand: true, cwd: 'util/ssl', src: ['**'], dest: 'build/server/ssl'}
				]
			},
			schemas: {
				files: [
					{expand: true, cwd: 'src/shared/schemas', src: ['**'], dest: 'build/shared/schemas'}
				]
			},
			sharedJsClient: {
				files: [
					{expand: true, cwd: 'src/shared/js', src: ['**'], dest: 'build/client/js'}
				]
			},
			sharedJsServer: {
				files: [
					{expand: true, cwd: 'src/shared/js', src: ['**'], dest: 'build/server'}
				]
			}
		},
		mochaTest: {
			unitServer: {
				options: {
					reporter: 'spec'
				},
				src: ['tests/unit/server/**/*']
			},
			unitShared: {
				options: {
					reporter: 'spec'
				},
				src: ['tests/unit/shared/**/*']
			},
			integration: {
				options: {
					reporter: 'spec'
				},
				src: ['tests/integration/**/*']
			}
		},
		watch: {
			server: {
				files: ['src/server/**'],
				tasks: ['build:server']
			},
			client: {
				files: ['src/client/html/**', 'src/client/css/**', 'src/client/js/**', 'src/client/img/**','src/client/partials/**', 'src/client/fonts/**'],
				tasks: ['build:client']
			},
			
			schemas: {
				files: ['src/shared/schemas/**'],
				tasks: ['build:schemas']
			},
			sharedJs: {
				files: ['src/shared/js/**'],
				tasks: ['build:server', 'build:client']
			},
			sass: {
				files: ['src/client/scss/**'],
				tasks: ['sass:compile']
			}
		},
		_clean: {
			build: ['build/'],
			node_modules: ['node_modules/'],
			bower_components: ['bower_components/']
		},
		sass: {
			compile: {
				options: {
					unixNewlines: true,
					sourcemap: true
				},
				files: [{
					expand: true,
					cwd: 'src/client/scss/',
					src: ['main.scss'],
					dest: 'build/client/css/',
					ext: '.css'
				}]
			},
			bootstrap: {
				options: {
					unixNewlines: true,
					sourcemap: true
				},
				files: [{
					expand: true,
					cwd: 'src/client/scss/',
					src: ['bootstrap.scss'],
					dest: 'build/client/css/',
					ext: '.css'
				}]
			}
		},
		env: {
			test: {
				NODE_ENV: 'test'
			}
		}
	});
};
