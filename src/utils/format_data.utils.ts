import * as moment from 'moment';
const format = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
const formatuuid = /[ `!@#$%^&*()_+\=\[\]{};':"\\|,.<>\/?~]/;
const formathome = /[`@#$%^&*;'|<>~]/;
const formatname = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;

export class FormatDataUtils {
    HaveSpecialFormat(input: string) {
        if (format.test(input))
            return true;
        return false;
    }

    HaveSpecialUuidFormat(input: string) {
        if (formatuuid.test(input))
            return true;
        return false;
    }

    HaveSpecialHomeFormat(input: string) {
        if (formathome.test(input))
            return true;
        return false;
    }

    HaveSpecialNameFormat(input: string) {
        if (formatname.test(input))
            return true;
        return false;
    }

    IsNumber(input: any) {

        try {
            const value = parseInt(input);
            if (typeof value !== 'number') {
                return false
            }
            if (value !== Number(value)) {
                return false
            }
            if (value === Infinity) {
                return false
            }
            return true
        } catch { return fail }
    }


    IsEmptyOrSpaces(str: string) {
        //return str === null || str.match(/^ *$/) !== null;
        if (!str)
            return true;
        else if (str.indexOf(' ') >= 0)
            return true;
        return false;
    }

    IsFormatIdentityCard(input: string) {
        let check = false;
        let cc;
        let sum = 0;
        let Cal = 0;
        for (let i = 0; i < 12; i++) {
            cc = input.substring(i, i + 1);
            let _sum = (parseInt(cc) * (13 - i));
            sum = sum + _sum;
        }
        Cal = sum % 11;
        if (Cal <= 1)
            Cal = 1 - Cal;
        else
            Cal = 11 - Cal;
        if (input.substring(12, 13) == Cal.toString())
            check = true;

        console.log('Identity : ' + check)
        return check;
    }

    async IsDateTimeFormat(input: string) {
        try {
            const isdata = moment(input, "YYYY-MM-DD HH:mm:ss").isValid();
            console.log('IsDateTimeFormat : '+isdata)
            return isdata;
        } catch (err) {
            console.log(err);
            return false;
        }
    }
}