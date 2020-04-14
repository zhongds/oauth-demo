const serve = require('koa-static');
const historyFallback = require('koa2-history-api-fallback');

const Router = require('@koa/router');
const Koa = require('koa');
const app = new Koa();
const router = new Router();
const fetch = require('node-fetch');

router.get('/auth/user', (ctx, next) => {
  const headers = ctx.request.headers;
  const newHeaders = {
    origin: 'http://localhost:9000',
    Accept: 'application/json',
    Authorization: headers['authorization'],
  }
  return fetch('https://api.github.com/user', {
    method: 'GET',
    headers: newHeaders,
  }).then(res => res.json())
  .then(res => {
    ctx.body = res;
  })
});

router.get('/auth/code', (ctx, next) => {
  const newHeaders = {
    origin: 'http://localhost:9000',
  }
  const str = ctx.request.querystring;
  let url = 'https://github.com/login/oauth/authorize?' + str;
  return fetch(url, {
    method: 'GET',
    headers: newHeaders,
  }).then(res => {
    return ctx.body = {
      uri: res.url
    }
  })
});

router.get('/auth/redirect', (ctx, next) => {
  const query = ctx.request.query;
  if (query.error) {
    ctx.body = 'error: ' + query.error + ' ' + query.error_description;
    return next();
  }
  const params = {
    client_id: '5f7b9345500882f40c0e',
    client_secret: '43ca75f5717406ba3235d9f95d5294483306dba3',
    code: query.code,
    // redirect_uri: 
    state: query.state,
  }

  const body = JSON.stringify(params);
  return fetch('https://github.com/login/oauth/access_token', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      // 'Accept': 'application/json',
    },
    body,
  }).then(res => res.text())
  .then(res => {
    ctx.redirect(query.redirect_uri + '#' + res);
  }).catch(err => {
    console.error(err);
  })
});

app.use(router.routes()).use(router.allowedMethods());

app.use(historyFallback());
app.use(serve('./public'));

app.listen(9000);

