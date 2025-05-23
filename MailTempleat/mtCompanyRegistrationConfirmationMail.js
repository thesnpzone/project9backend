module.exports = function companyRegistrationConfirmationEmail({ companyName, officialEmail }) {
    return {
        subject: '🎉 SkillHunt Company Registration Successful',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
        <h2 style="color: #27428E;">Welcome to SkillHunt!</h2>
        <p>Hi <strong>${companyName}</strong>,</p>
        <p>Your company registration has been <strong>successfully completed</strong>.</p>

        <h3 style="color: #27428E;">Login Credentials</h3>
        <p><strong>Official Email:</strong> ${officialEmail}</p>

        <p>Your password has been securely sent to your registered email address.</p>
        <p><em>No need to memorize this password.</em><br/>
        Each time you login, a new password will be sent to your email automatically for security.</p>

        <p>We’re excited to have you onboard. Let’s grow together!</p>

        <br/>
        <p>Regards,</p>
        <p><strong>SkillHunt Team</strong></p>
      </div>
    `
    };
};