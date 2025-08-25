// utils/cookieManager.js
const isProd         = process.env.NODE_ENV === "production";
const needsCrossSite = Boolean(process.env.FRONTEND_ORIGIN);
const sameSite       = needsCrossSite ? "none" : "lax";
const secureFlag     = isProd || sameSite === "none";
const cookieDomain   = process.env.COOKIE_DOMAIN; // optional, sonst undefined

const baseOpts = {
  path: "/",
  sameSite,
  secure: secureFlag,
  domain: cookieDomain
};

function setAuthCookie(res, token) {
  res.cookie("token", token, {
    ...baseOpts,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 // 1h
  });
}

function clearAuthCookie(res) {
  res.clearCookie("token", {
    ...baseOpts,
    httpOnly: true
  });
}

function setCsrfCookie(res, token) {
  res.cookie("XSRF-TOKEN", token, {
    ...baseOpts,
    httpOnly: false
  });
}

module.exports = { setAuthCookie, clearAuthCookie, setCsrfCookie };
