module.exports = function companyLoginPasswordEmail({ tempPassword, studentName }) {
    return {
        subject: 'Your SkillHunt Login Password',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
        <h2 style="color: #27428E;">SkillHunt Company Login Access</h2>
        
        <p>Hi <strong>${studentName}</strong>,</p>
        
        

        <p>You can log in using your <strong> Registered email ID</strong>.</p>
        
        <p><strong>Your temporary login password is:</strong></p>
        <div style="font-size: 24px; font-weight: bold; color: #27428E; margin: 20px 0;">
          ${tempPassword}
        </div>

        <p>This password has been sent to your registered email ID.</p>
        
        <p><strong>No need to remember this password every time.</strong> For your security, a fresh login password will be sent to your registered email every time you try to log in.</p>
        
        <p>If you didn’t try to log in, please ignore this message or contact our support team.</p>

        <br/>
        <p>Regards,</p>
        <p><strong>SkillHunt Team</strong></p>
      </div>
    `
    };
};