const securityHeaders=[
 {key:"Content-Security-Policy",value:"default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://ani-api.kaehana.com; frame-src https://www.youtube-nocookie.com; media-src 'none'; worker-src 'self'; manifest-src 'self'; upgrade-insecure-requests"},
 {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
 {key:"X-Content-Type-Options",value:"nosniff"},
 {key:"X-Frame-Options",value:"DENY"},
 {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()"},
 {key:"Cross-Origin-Opener-Policy",value:"same-origin"},
 {key:"Cross-Origin-Resource-Policy",value:"same-origin"},
 {key:"Strict-Transport-Security",value:"max-age=63072000; includeSubDomains; preload"}
];
export default {poweredByHeader:false,async headers(){return [{source:"/:path*",headers:securityHeaders}]}};
