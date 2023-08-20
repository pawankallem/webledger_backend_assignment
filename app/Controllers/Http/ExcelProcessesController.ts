import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import File from "App/Models/File";
import Client from "App/Models/Client";
import Bank from "App/Models/Bank";
import Address from "App/Models/Address";

export default class ExcelProcessesController {
  public async process(ctx: HttpContextContract) {
    type ClientDataProp = {
      client_number: string;
      client_type: string;
      legal_name?: string;
      email?: string;
      phone?: string;
      gstin?: string;
      pan?: string;
    };
    type ErrorDataProp = {
      status: string;
      message: string;
      data?: ClientDataProp | string;
    };

    const files = await File.query().orderBy("id").limit(3);
    // const files = await File.all()
    let errorData: ErrorDataProp[] = [];

    for (let file of files) {
      const xlsx = require("xlsx");
      const xlsxFile = xlsx.readFile(file.$original.filePath);
      let commonclients;
      const seenPanNumbers = new Set();

      const validation = (type, text) => {
        if (!text) return null;
        text = text.toString().trim();
        if (!text) return null;
        switch (type) {
          case "name":
            let name = text;
            let normalizedName = name.replace(
              /\w\S*/g,
              (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            );
            return normalizedName.replace(/[^\w\s]|(\s{2,})|,/g, "").trim();
          case "email":
            let email = text;
            let normalizedEmail = email.replace(
              /@([A-Za-z0-9.-]+)/g,
              (match, domain) => "@" + domain.toLowerCase()
            );
            let cleanedEmail = normalizedEmail.replace(
              /[^\w\d@.]|(\s{2,})|,/g,
              ""
            );
            cleanedEmail = encodeURIComponent(cleanedEmail);
            return decodeURIComponent(cleanedEmail);
          case "phoneNumber":
            let number = text;
            let cleanedNumber = number.replace(/\D/g, "");
            let numberPattern = /^[0-9]{3,10}$/;
            return numberPattern.test(cleanedNumber)
              ? Number(cleanedNumber)
              : null;
          case "pan":
            let pan = text;
            let cleanedPan = pan.replace(/[^A-Za-z0-9]+/g, "").toUpperCase();
            if (cleanedPan.length !== 10) return null;
            let panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
            if (panPattern.test(cleanedPan)) {
              seenPanNumbers.add(cleanedPan);
              return cleanedPan;
            } else return null;
          case "clientNumber":
            let clientNumber = text;
            let normalizedClientNumber = clientNumber.toLowerCase();
            let cleanedClientNumber = normalizedClientNumber.replace(
              /[^a-z0-9/]/g,
              ""
            );
            return cleanedClientNumber;
          default:
            return text;
        }
      };

      for (const sheetName of xlsxFile.SheetNames) {
        const sheetData = xlsx.utils.sheet_to_json(xlsxFile.Sheets[sheetName]);
        if (sheetName === "Clients") {
          commonclients = sheetData;
          let previousClientNumber = new Set();
          let previousPanNumber = new Set();

          for (const client of sheetData) {
            try {
              const clientNumber = client.client_number;
              const clientType = client.client_type;
              const name = validation(
                "name",
                client.legal_name ? client.legal_name : client.Name
              );
              const email = validation("email", client.email);
              const phone = validation("phoneNumber", client.phone);
              const gstin = client.gstin;
              const pan = validation("pan", client.pan);

              const dbCheck = await Client.query()
                .where("name", name)
                .where("email", email)
                .where("phoneNumber", phone)
                .where("pan", pan)
                .first();

              if (dbCheck) {
                errorData.push({
                  status: "Incompleted",
                  message: "Data already exist!",
                  data: {
                    client_number: clientNumber,
                    client_type: clientType,
                    legal_name: name,
                    email: email,
                    phone: phone,
                    gstin: gstin,
                    pan: pan,
                  },
                });
                continue;
              }

              if (
                previousClientNumber.has(clientNumber) &&
                previousPanNumber.has(pan)
              ) {
                continue;
              }
              if (
                clientNumber === "" ||
                (clientType !== "Customer" &&
                  clientType !== "Vendor" &&
                  clientType !== "Both")
              ) {
                errorData.push({
                  status: "Incompleted",
                  message:
                    "Client legal_name is required and client_type must be Customer/Vendor/Both!",
                  data: {
                    client_number: clientNumber,
                    client_type: clientType,
                    legal_name: name,
                    email: email,
                    phone: phone,
                    gstin: gstin,
                    pan: pan,
                  },
                });
                continue;
              }
              previousPanNumber.add(pan);
              previousClientNumber.add(clientNumber);

              const newClient = new Client();
              newClient.name = name;
              newClient.email = email;
              newClient.phoneNumber = phone;
              newClient.pan = pan;

              await newClient.save();
            } catch (error) {
              console.log("error: ", error);
            }
          }
        } else if (sheetName === "Banks") {
          for (const bank of sheetData) {
            try {
              const clientNumber = bank.client_number;
              const bankName = validation("name", bank["Bank Name"]);
              const ifsc = bank.IFSC;
              const accountNo = bank.account_no;
              const accountHolderName = validation(
                "name",
                bank.account_holder_name
              );
              const accountType = bank.account_type;
              const branchName = bank.branch_name;

              if (!Number(accountNo)) {
                continue;
              }
              const clientAccountNumber = await Bank.findBy(
                "account_number",
                accountNo
              );
              if (clientAccountNumber) {
                continue;
              }
              const clientBankName = await Bank.findBy("bank_name", bankName);
              if (clientBankName) {
                continue;
              }
              const bankClient = await Client.findBy("name", accountHolderName);
              if (!bankClient) {
                continue;
              }
              const dbCheck = await Bank.query()
                .where("client_id", bankClient.id)
                .where("bank_name", bankName)
                .where("account_holder_name", accountHolderName)
                .where("account_number", accountNo)
                .first();

              if (dbCheck) {
                continue;
              }

              const newBank = new Bank();
              newBank.clientId = bankClient.id;
              newBank.bankName = bankName;
              newBank.accountNumber = accountNo;
              newBank.accountHolderName = accountHolderName;
              newBank.ifscCode = ifsc;
              newBank.city = branchName;

              await newBank.save();
            } catch (error) {
              console.log("error: ", error);
            }
          }
        } else if (sheetName === "Addresses") {
          for (const address of sheetData) {
            try {
              const clientNumber = address.client_number;
              const address1 = validation("name", address.address_1);
              const address2 = validation("name", address.address_2);
              const city = validation("name", address.city);
              const state = address.state;
              const pincode = address.pincode;

              if (!Number(pincode)) {
                continue;
              }

              const dbAddress = await Address.query()
                .where("address_line_1", address1)
                .where("address_line_2", address2)
                .first();

              if (dbAddress) {
                continue;
              }

              const common = commonclients?.find(
                (ele) => ele.client_number === clientNumber
              );

              const bclient = await Client.findBy(
                "name",
                common?.legal_name ? common?.legal_name : common.Name
              );
              if (!bclient) {
                console.log("No corresponding client found for bank:", address);
                continue;
              }

              const newAddress = new Address();
              newAddress.clientId = bclient.id;
              newAddress.addressLine1 = address1;
              newAddress.addressLine2 = address2;
              newAddress.city = city;
              newAddress.state = state;
              newAddress.zip = pincode;

              await newAddress.save();
            } catch (error) {
              console.log("error: ", error);
            }
          }
        }
      }
    }
    if (errorData.length > 0) {
      return ctx.response.json({ errorData });
    } else {
      return ctx.response.json({
        message: "Data uploaded Succesfully!",
      });
    }
  }
}
