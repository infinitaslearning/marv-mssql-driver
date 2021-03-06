var Hath = require('hath')
var marv = require('marv')
var path = require('path')
var mssql = require('mssql')
var fs = require('fs')

function shouldRunMigration(t, done) {
    const dropTables = load(t, ['sql', 'drop-tables.sql'])
    const client = new mssql.ConnectionPool(t.locals.config.connection)
    client.connect(function(err) {
        if (err) throw err
        client.query(dropTables, function(err) {
            if (err) throw err
            marv.scan(path.join(__dirname, 'migrations'), function(err, migrations) {
                if (err) throw err
                marv.migrate(migrations, t.locals.driver, function(err) {
                    if (err) throw err
                    client.query('SELECT * FROM foo', function(err, result) {
                        if (err) throw err
                        t.assertEquals(result.recordset.length, 1)
                        t.assertEquals(result.recordset[0].id, 1)
                        t.assertEquals(result.recordset[0].value, 'foo')

                        client.query('SELECT * FROM bar', function(err, result) {
                            if (err) throw err
                            t.assertEquals(result.recordset.length, 1)
                            t.assertEquals(result.recordset[0].id, 1)
                            t.assertEquals(result.recordset[0].value, 'bar')
                            client.close()
                            done()
                        })
                    })
                })
            })
        })
    })
}

function load(t, location) {
    return fs.readFileSync(path.join.apply(null, [__dirname].concat(location)), 'utf-8').replace(/migrations/g, t.locals.config.table)
}

module.exports = Hath.suite('Driver Tests', [
    shouldRunMigration
])
