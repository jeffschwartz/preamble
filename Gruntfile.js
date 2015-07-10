module.exports = function ( grunt ) {

    // Project configuration.
    grunt.initConfig({
        pkg    : grunt.file.readJSON( 'package.json' ),
        jshint : {
            options: {
                jshintrc: true
            },
            files   : ['src/javascripts/**/*.js']
        },
        browserify : {
            js: {
                src: 'src/javascripts/main.js',
                dest: 'dist/preamble.js'
            }
        },
        usebanner: {
            dist: {
                options: {
                    position: 'top',
                    banner: '/* <%= pkg.title %> v<%= pkg.version %>' +
                    ' - released on <%= grunt.template.today("yyyy-mm-dd") %>\n' +
                    ' * <%= pkg.preamble.copyright %>\n' +
                    ' * <%= pkg.preamble.distrights%>\n' +
                    '*/',
                    linebreak: true
                },
                files: {
                    src: [ 'dist/preamble.js', 'dist/preamble.js' ]
                }
            }
        },
        watch  : {
            js : {
                files   : ['src/javascripts/**/*.js'],
                tasks   : ['jshint'],
                options : {
                    interrupt : true
                }
            },
            browserify : {
                files   : ['src/javascripts/**/*.js'],
                tasks   : ['browserify'],
                options : {
                    interrupt : true
                }
            },
            banner : {
                files   : ['dist/preamble.js'],
                tasks   : ['usebanner'],
                options : {
                    interrupt : true
                }
            }
        }
    });

    // Load the plugins
    grunt.loadNpmTasks( 'grunt-contrib-watch' );
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-banner');

    // Default task(s).
    grunt.registerTask( 'default', ['watch'] );
    grunt.registerTask( 'dist', ['jshint', 'browserify', 'usebanner'] );

};
