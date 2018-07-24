const SqlUtil = (function() {
  var that
  var obj = function(options) {
    that = this
    that.options = options || {}

    if (!that.options.database) {
      console.log('请指定数据库文件地址')
      return
    }

    loadDatabase()
  }

  // 加载数据库文件
  function loadDatabase() {
    var xhr = new XMLHttpRequest()
    xhr.open('GET', that.options.database, true)
    xhr.responseType = 'arraybuffer'

    xhr.onload = function(e) {
      var uInt8Array = new Uint8Array(this.response)
      that.db = new SQL.Database(uInt8Array)
      // 数据库加载完毕后调用init方法
      that.options.init && that.options.init(that.db)
    }
    xhr.send()
  }

  /**
   * 执行sql，返回单条数据
   * @param {*} db
   * @param {*} sql
   * @param {*} params
   * @param {*} callback
   */
  function selectOneBySql(db, sql, params, callback) {
    var stmt = db.prepare(sql)
    var result = stmt.getAsObject(params || {})
    stmt.free()
    callback && callback(result)
  }

  /**
   * 执行sql返回多条记录
   * @param {*} db
   * @param {*} sql
   * @param {*} params
   * @param {*} callback
   */
  function selectBySql(db, sql, params, callback) {
    // 准备查询SQL
    var stmt = db.prepare(sql)
    // 准备查询参数
    stmt.bind(params || {})
    // 准备数组
    let results = []
    while (stmt.step()) {
      results.push(stmt.getAsObject())
    }
    // 释放内存
    stmt.free()
    callback && callback(results)
  }

  /**
   * 分页查询数据
   * @param {*} db
   * @param {*} sql
   * @param {*} params
   * @param {*} callback
   */
  function selectByPage(db, sql, params, callback) {
    // 截取from后面的主体SQL
    const mainSql = sql.split('FROM')[1]
    const countSql = `SELECT COUNT(*) as count FROM ${mainSql}`
    // 准备查询数量的SQL
    const stmtCount = db.prepare(countSql)
    const count = stmtCount.getAsObject(params)
    stmtCount.free()

    // 准备分页数据SQL
    const rowSql = `sql LIMIT :pageIndex OFFSET :pageSize`
    const stmtRow = db.prepare(sql)
    if (params.pageIndex === undefined || params.pageIndex === null) {
      params.pageIndex = 0
    }
    if (params.pageSize === undefined || params.pageSize == null) {
      params.pageSize = 10
    }
    stmtRow.bind(params)

    let results = []
    while (stmtRow.step()) {
      results.push(stmtRow.getAsObject())
    }
    // 释放内存
    stmtRow.free()
    callback &&
      callback({
        count: count.count,
        data: results,
        pageIndex: params.pageIndex,
        pageSize: params.pageSize
      })
  }

  function update(db, sql, params, callback) {
    db.run(sql, params)
    callback && callback(true)
  }

  obj.prototype.SelectOne = selectOneBySql
  obj.prototype.Select = selectBySql
  obj.prototype.SelectPage = selectByPage

  return obj
})()
