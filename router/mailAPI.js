const nodemailer = require('nodemailer');
const { google } = require('googleapis');

// These id's and secrets should come from .env file.
const { CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI,
    REFRESH_TOKEN,
    HOST_URL} = process.env

const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function sendMail(username, email, signUpToken) {
    try {
        const accessToken = await oAuth2Client.getAccessToken();

        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: 'daf260498@gmail.com',
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken,
            },
        });

        const mailHTML = `<table>
            <td style="vertical-align:top" width="580" valign="top" align="left">
            <span
            style="font-family:Roboto,SegoeUI,Helvetica,Arial,sans-serif;line-height:20px;font-size:14px;color:#3b3855">
            Hi ${username},<br>
            <br>
            <div> Thank you for creating a
            Novel <b>+</b> account. For your
            security, please verify your
            account.</div>
            </span>            <br style="font-size:20px;line-height:20px">
            <table cellspacing="0" cellpadding="0" border="0" bgcolor="#07538F">
            <tbody>                    <tr>
            <td style="vertical-align:top" width="24">
            </td>
            <td style="vertical-align:top" valign="top" align="left">
            <table cellspacing="0" cellpadding="0" border="0">
            <tbody>
            <tr>
            <td style="vertical-align:top" height="12">
            </td>
            </tr>
            <tr>
            <td style="vertical-align:top" valign="top" align="left" height="14">
            <a href="${HOST_URL}/ActivateAccount/${signUpToken}"
            style="font-weight:bold;text-decoration:none;line-height:14px;font-family:Roboto,SegoeUI,Helvetica,Arial,sans-serif;font-size:14px;color:#ffffff"
            target="_blank"
            style="font-weight:bold;text-decoration:none;line-height:14px;font-family:Roboto,SegoeUI,Helvetica,Arial,sans-serif;font-size:14px;color:#ffffff">Verify
            My Account</span></a>
            </td>                                   </tr>                                    <tr>                                        <td style="vertical-align:top" height="12">
            </td>                                    </tr>                                </tbody>                            </table>                        </td>                        <td style="vertical-align:top" width="24">
            </td>                    </tr>                </tbody>            </table>            <table>                <tbody>                    <tr>                        <td style="vertical-align:top" width="580" valign="top" align="left">
            <span
            style="font-family:Roboto,SegoeUI,Helvetica,Arial,sans-serif;line-height:20px;font-size:14px;color:#3b3855">
            <br>   <br>
            Happy Reading,
            <br>
            NovelPLus
            </span> </td>    </tr></tbody></table></td></table>
            `
        const mailOptions = {
            from: 'noReplay@readnovelplus.com <daf260498@gmail.com>',
            to: `${email}`,
            subject: '[Action required] Verify your NovelPLus account',
            text: `${username}Activate your account by clicking`,
            html: `${mailHTML}`,
        };
        console.log(signUpToken);
        const result = await transport.sendMail(mailOptions);
        return result;
    } catch (error) {
        return error;
    }
}

// sendMail()
//     .then((result) => console.log('Email sent...', result))
//     .catch((error) => console.log(error.message));

module.exports = sendMail;