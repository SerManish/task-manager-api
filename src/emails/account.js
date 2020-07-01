const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.API_KEY);
const sendWelcomemail = (email,name)=>{
        sgMail.send({
        from:'welcome@taskmanager.com',
        to:email,
        subject:"Welcome to Task Mangager",
        text:`Hi,${name} welcome to task manager, here you can manage your tasks in a very easy way.`
    }  )
}

const sendLastmail = (email,name)=>{
    sgMail.send({
    from:'goodbye@taskmanager.com',
    to:email,
    subject:"Task Manager Account deleted",
    text:`Hi,${name} please tell us what can we improve to keep you as a customer.`
}  )
}

module.exports = {
    sendWelcomemail,
    sendLastmail
}