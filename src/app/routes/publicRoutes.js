const proxyHeaders = require('../proxy/proxyUtils.js')
const proxy = require('express-http-proxy')
const bodyParser = require('body-parser')
const permissionsHelper = require('../helpers/permissionsHelper.js')
const envHelper = require('../helpers/environmentVariablesHelper.js')
const contentProxyUrl = envHelper.CONTENT_PROXY_URL
const learnerURL = envHelper.LEARNER_URL
const formURL = envHelper.FORM_URL
const reqDataLimitOfContentUpload = '50mb'
const contentServiceBaseUrl = envHelper.CONTENT_URL
const logger = require('sb_logger_util_v2')

module.exports = function (app) {
    const proxyReqPathResolverMethod = function (req) {
        return require('url').parse(contentProxyUrl + req.originalUrl).path
    }

    app.post('/api/data/v1/page/*',
        permissionsHelper.checkPermission(),
        proxy(learnerURL, {
        proxyReqOptDecorator: proxyHeaders.decorateSunbirdRequestHeaders(),
        proxyReqPathResolver: function (req) {
            let urlParam = req.originalUrl.replace('/api/', '')
            let query = require('url').parse(req.url).query
            if (query) {
            return require('url').parse(learnerURL + urlParam + '?' + query).path
            } else {
            return require('url').parse(learnerURL + urlParam).path
            }
        },
        userResDecorator: function (proxyRes, proxyResData,  req, res) {
            try {
                logger.info({msg: '/api/data/v1/page'});
                const data = JSON.parse(proxyResData.toString('utf8'));
                if(req.method === 'GET' && proxyRes.statusCode === 404 && (typeof data.message === 'string' && data.message.toLowerCase() === 'API not found with these values'.toLowerCase())) res.redirect('/')
                else return proxyHeaders.handleSessionExpiry(proxyRes, proxyResData, req, res, data);
            } catch(err) {
                logger.error({msg:'content api user res decorator json parse error:', proxyResData})
                    return proxyHeaders.handleSessionExpiry(proxyRes, proxyResData, req, res);
            }
        }
        })
    )

    app.post('/api/org/v1/search',
        permissionsHelper.checkPermission(),
        proxy(learnerURL, {
        limit: reqDataLimitOfContentUpload,
        proxyReqOptDecorator: proxyHeaders.decorateSunbirdRequestHeaders(),
        proxyReqPathResolver: function (req) {
            let urlParam = req.originalUrl.replace('/api/', '')
            let query = require('url').parse(req.url).query
            if (query) {
            return require('url').parse(learnerURL + urlParam + '?' + query).path
            } else {
            return require('url').parse(learnerURL + urlParam).path
            }
        },
        userResDecorator: function (proxyRes, proxyResData,  req, res) {
            try {
            logger.info({msg: '/api/org/v1/search'});
            const data = JSON.parse(proxyResData.toString('utf8'));
            if(req.method === 'GET' && proxyRes.statusCode === 404 && (typeof data.message === 'string' && data.message.toLowerCase() === 'API not found with these values'.toLowerCase())) res.redirect('/')
            else return proxyHeaders.handleSessionExpiry(proxyRes, proxyResData, req, res, data);
            } catch(err) {
            logger.error({msg:'content api user res decorator json parse error:', proxyResData})
                return proxyHeaders.handleSessionExpiry(proxyRes, proxyResData, req, res);
            }
        }
        })
    )
    
    app.post('/api/data/v1/form/read',
    permissionsHelper.checkPermission(),
    proxy(formURL, {
    limit: reqDataLimitOfContentUpload,
    proxyReqOptDecorator: proxyHeaders.decorateSunbirdRequestHeaders(),
    proxyReqPathResolver: function (req) {
        let urlParam = req.originalUrl.replace('/api/', '')
        let query = require('url').parse(req.url).query
        if (query) {
        return require('url').parse(formURL + urlParam + '?' + query).path
        } else {
        return require('url').parse(formURL + urlParam).path
        }
    },
    userResDecorator: function (proxyRes, proxyResData,  req, res) {
        try {
        logger.info({msg: '/api/data/v1/form/read'});
        const data = JSON.parse(proxyResData.toString('utf8'));
        if(req.method === 'GET' && proxyRes.statusCode === 404 && (typeof data.message === 'string' && data.message.toLowerCase() === 'API not found with these values'.toLowerCase())) res.redirect('/')
        else return proxyHeaders.handleSessionExpiry(proxyRes, proxyResData, req, res, data);
        } catch(err) {
        logger.error({msg:'form api res decorator json parse error:', proxyResData})
            return proxyHeaders.handleSessionExpiry(proxyRes, proxyResData, req, res);
        }
    }
    })
)
    app.use('/api/*', permissionsHelper.checkPermission(), proxy(contentProxyUrl, {
        proxyReqPathResolver: proxyReqPathResolverMethod
    }))
}

