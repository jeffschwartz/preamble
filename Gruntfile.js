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
                options: {
                    banner: '/* <%= pkg.title %> v<%= pkg.version %>' +
                    ' - released on <%= grunt.template.today("yyyy-mm-dd") %>' +
                    ' at <%= grunt.template.today("longTime") %>\n' +
                    ' * <%= pkg.preamble.copyright %>\n' +
                    ' * <%= pkg.preamble.distrights%>\n' +
                    '*/'
                },
                src: 'src/javascripts/main.js',
                dest: 'dist/preamble.js',
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
            }
        }
    });

    // Load the plugins
    grunt.loadNpmTasks( 'grunt-contrib-watch' );
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-browserify');

    // Default task(s).
    grunt.registerTask( 'default', ['watch'] );
    // Distribution task - can be run when building a release.
    grunt.registerTask( 'dist', ['jshint', 'browserify'] );

};
