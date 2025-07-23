/**
 * Copyright 2022 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();

const transporter = nodemailer.createTransport({
  host: functions.config().smtp.host,
  port: functions.config().smtp.port,
  secure: true,
  auth: {
    user: functions.config().smtp.user,
    pass: functions.config().smtp.password,
  },
});

exports.sendEmail = functions.firestore
    .document("mail/{docId}")
    .onCreate(async (snap) => {
      const mailData = snap.data();

      if (!mailData) {
        console.log("No mail data found, exiting.");
        return;
      }

      const mailOptions = {
        from: mailData.from || functions.config().smtp.from,
        to: mailData.to,
        subject: mailData.message.subject,
        text: mailData.message.text,
        html: mailData.message.html,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log("Email sent to:", mailData.to.join(", "));
      } catch (error) {
        console.error("There was an error while sending the email:", error);
      }
    });
