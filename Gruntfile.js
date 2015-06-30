module.exports = function ( grunt ) {

    // Project configuration.
    grunt.initConfig({
        pkg    : grunt.file.readJSON( 'package.json' ),
        less   : {
            production  : {
                files : {
                    'stylesheets/preamble.css' : 'stylesheets/preamble.less'
                }
            }
        },
        jshint : {
            options: {
                jshintrc: true
            },
            files   : [
                'javascripts/preamble.js',
                'javascripts/sample-failures-test.js',
                'javascripts/sample-suite.js',
            ]
        },
        browserify : {
            js: {
                src: 'src/javascripts/preamble.js',
                dest: 'dist/preamble.js'
            }
        },
        shell: {
            phantomjs: {
                command: 'phantomjs javascripts/phantom-runner.js index.html',
                options: {
                    stdout: true
                }
            }
        },
        watch  : {
            less : {
                files   : ['**/*.less'],
                tasks   : ['less'],
                options : {
                    interrupt : true
                }
            },
            js : {
                files   : ['javascripts/*.js'],
                tasks   : ['jshint'],
                options : {
                    interrupt : true
                }
            },
            browserify : {
                files   : ['src/**.js'],
                tasks   : ['browserify'],
                options : {
                    interrupt : true
                }
            },
            test : {
                files   : ['javascripts/preamble.js', 'javascripts/sample-bdd-test.js'],
                tasks   : ['shell:phantomjs'],
                options : {
                    interrupt : true
                }
            }
        }
    });

    // Load the plugins
    grunt.loadNpmTasks( 'grunt-contrib-less' );
    grunt.loadNpmTasks( 'grunt-contrib-watch' );
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-browserify');

    // Default task(s).
    grunt.registerTask( 'default', ['watch'] );

};
