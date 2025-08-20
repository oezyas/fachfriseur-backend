function setAuthCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.SAME_SITE || "strict",
    maxAge: 1000 * 60 * 60
  });
}

function clearAuthCookie(res) {
  res.clearCookie("token");
}

function setCsrfCookie(res, token) {
  res.cookie("XSRF-TOKEN", token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.SAME_SITE || "strict"
  });
}

module.exports = { setAuthCookie, clearAuthCookie, setCsrfCookie };
