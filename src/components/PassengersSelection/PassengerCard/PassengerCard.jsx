import {
   useState,
   useRef,
   useEffect,
   useCallback,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import dayjs from 'dayjs';
import dayjsGenerateConfig from "rc-picker/es/generate/dayjs";
import generatePicker from 'antd/es/date-picker/generatePicker';

import ru_RU from 'antd/lib/locale/ru_RU';

import {
   Form,
   Select,
   Input,
   Checkbox,
   ConfigProvider,
   Radio,
   Button,
   InputNumber,
   Alert,
} from 'antd';

import { addPassengerId } from '../../../store/slices/seatsSlice';
import {
   addNewPassenger,
   editPassengerData,
   removePassenger,
   selectPassengers,
} from '../../../store/slices/passengersSlice';
import { selectSelectedCoaches } from '../../../store/slices/trainSlice';

import minusRound from '../img/minus-round.svg';
import cross from '../img/cross.svg';
import plusRound from '../img/plus-round.svg';

import passengerTypes from '../../SeatsSelection/SelectionBlock/passengerTypes';
import pasTypesRus from '../../SeatsSelection/SelectionBlock/pasTypesRus';
import docTypes from './docTypes';
import directions from '../../../data/directions';
import fieldNames from './fieldNames';
import rules from './rules';

import styles from './PassengerCard.module.scss';
import './PassengerCard.scss';
import links from '../../../data/links';

import 'dayjs/locale/ru';

dayjs.locale('ru');

const DatePicker = generatePicker(dayjsGenerateConfig);

function PassengerCard({
   passengerType,
   pasNumber,
   clickOnRemovePassHandler,
   clickOnNextPassHandler,
   id,
   unchosenSeats,
   unchosenSeatsDep,
   unchosenSeatsArr,
   isLastPassenger = false,
}) {
   const dispatch = useDispatch();
   const thisPassenger = useSelector(selectPassengers).filter(
      (pas) => pas.id === id
   );
   const coaches = useSelector(selectSelectedCoaches);

   const [expanded, setExpanded] = useState(true);
   const [showError, setShowError] = useState(false);
   const [departureOnly, setDepartureOnly] = useState(!unchosenSeatsArr);
   const [disabledForwardBtn, setDisabledForwardBtn] = useState(false);
   const [form] = Form.useForm();
   const [documentType, setDocumentType] = useState(
      thisPassenger[0]?.documentType || passengerType === passengerTypes.adults
         ? docTypes.passport
         : docTypes.birthCertif
   );

   // 1. ФИКСИРУЕМ initialValues, чтобы форма не сбрасывалась при сохранении в Redux
   const [initialValues] = useState(() => {
      if (thisPassenger.length > 0) {
         const pas = thisPassenger[0];
         const vals = {
            passengerType: pas.passengerType,
            firstName: pas.firstName,
            lastName: pas.lastName,
            fathersName: pas.fathersName,
            gender: pas.gender,
            documentType: pas.documentType,
         };
         if (pas.specialNeeds) vals.specialNeeds = pas.specialNeeds;
         if (pas.documentType === docTypes.passport) {
            vals.documentSerialNumber = pas.documentSerialNumber;
            vals.documentNumber = pas.documentNumber;
         }
         if (pas.documentType === docTypes.birthCertif) {
            vals.documentNumber = pas.documentNumber;
         }
         if (pas.departureOnly) vals.departureOnly = pas.departureOnly;
         if (pas.dateOfBirth) {
            const data = pas.dateOfBirth.split('.');
            vals.dateOfBirth = dayjs(`${data[1]}.${data[0]}.${data[2]}`);
         }
         return vals;
      }
      return {
         passengerType,
         documentType:
            passengerType === passengerTypes.adults
               ? docTypes.passport
               : docTypes.birthCertif,
      };
   });

   const unchosenSeatsAdults = unchosenSeats.filter(
      (el) => el.priceCoefficient === 1
   ).length;
   const unchosenSeatsChildren = unchosenSeats.filter(
      (el) => el.priceCoefficient === 0.5
   ).length;

   const [unchosenSeatsDepSourse, setUnchosenSeatsDepSourse] = useState(
      passengerType === passengerTypes.toddlers
         ? []
         : unchosenSeatsDep.filter(
              (el) =>
                 el.priceCoefficient ===
                 (passengerType === passengerTypes.adults ? 1 : 0.5)
           )
   );

   const [unchosenSeatsArrSourse, setUnchosenSeatsArrSourse] = useState(
      passengerType === passengerTypes.toddlers
         ? []
         : unchosenSeatsArr.length > 0 &&
              unchosenSeatsArr.filter(
                 (el) =>
                    el.priceCoefficient ===
                    (passengerType === passengerTypes.adults ? 1 : 0.5)
              )
   );
   const [highAgeError, setHighAgeError] = useState(false);
   const [lowAgeError, setLowAgeError] = useState(false);

   const bottomSectionStyles = showError
      ? `${styles.passengerCard__bottom} ${styles['passengerCard__bottom-error']}`
      : styles.passengerCard__bottom;

   let seatInfo;

   if (thisPassenger.length > 0) {
      if (thisPassenger[0].seatDep || thisPassenger[0].seatArr) {
         const allCoaches = [
            ...coaches[directions.departure],
            ...coaches[directions.arrival],
         ];
         const seatDepData = thisPassenger[0].seatDep?.split(':');
         const seatArrData = thisPassenger[0].seatArr?.split(':');

         const seatInfoMaker = (direction, seatData) => (
            <div>
               <span className={styles.seatDirection}>
                  {direction === directions.departure ? 'Туда' : 'Обратно'}
               </span>
               <span>
                  {` вагон: ${
                     allCoaches?.filter((el) => el.coachId === seatData[0])[0]
                        ?.name
                  }
                  , место: ${seatData[1]}`}
               </span>
            </div>
         );

         const oneWaySeatInfoMaker = (direction, seatData) => (
            <div>
               <div className={styles.seats}>Выбранное место</div>
               {seatInfoMaker(direction, seatData)}
            </div>
         );

         if (thisPassenger[0].seatDep && thisPassenger[0].seatArr) {
            seatInfo = (
               <div>
                  <div className={styles.seats}>Выбранные места</div>
                  {seatInfoMaker(directions.departure, seatDepData)}
                  {seatInfoMaker(directions.arrival, seatArrData)}
               </div>
            );
         } else if (thisPassenger[0].seatDep) {
            seatInfo = oneWaySeatInfoMaker(directions.departure, seatDepData);
         } else if (thisPassenger[0].seatArr) {
            seatInfo = oneWaySeatInfoMaker(directions.arrival, seatArrData);
         }
      }
   }

   const seatsFilter = useCallback(
      (coef) => {
         setUnchosenSeatsDepSourse(
            unchosenSeatsDep.filter((el) => el.priceCoefficient === coef)
         );
         if (unchosenSeatsArr.length > 0 && !departureOnly) {
            setUnchosenSeatsArrSourse(
               unchosenSeatsArr.filter((el) => el.priceCoefficient === coef)
            );
         }
      },
      [departureOnly, unchosenSeatsArr, unchosenSeatsDep]
   );

   useEffect(() => {
      if (thisPassenger[0]?.documentType) {
         if (thisPassenger[0]?.documentType === docTypes.birthCertif) {
            setDocumentType(docTypes.birthCertif);
            seatsFilter(0.5);
         } else {
            setDocumentType(docTypes.passport);
            seatsFilter(1);
         }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   const docTypeselectClasses =
      documentType === docTypes.passport
         ? 'passengerCard-doc-select-pass'
         : 'passengerCard-doc-select-birth-sertificate';

   const disabledDate = (current) => current && current > dayjs(new Date());

   const title = useRef(document.createElement('div'));
   useEffect(() => {
      title.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
   }, []);


   const dispatchMaker = (data, direct, idToSend = null) => {
      if (!data || typeof data !== 'string') return;
      const [coachId, seatNum] = data.split(':');
      dispatch(
         addPassengerId({
            seat: Number(seatNum),
            direction: direct,
            coachId,
            passengerId: idToSend,
         })
      );
   };

   const clickOnHeaderHandler = () => {
      setExpanded(!expanded);
   };

   const clickOnRemoveCardHandler = () => {
      if (form.getFieldValue(fieldNames.seatArr)) {
         dispatchMaker(
            form.getFieldValue(fieldNames.seatArr),
            directions.arrival
         );
      }

      if (form.getFieldValue(fieldNames.seatDep)) {
         dispatchMaker(
            form.getFieldValue(fieldNames.seatDep),
            directions.departure
         );
      }

      if (thisPassenger[0]?.seatArr) {
         dispatchMaker(thisPassenger[0].seatArr, directions.arrival);
      }

      if (thisPassenger[0]?.seatDep) {
         dispatchMaker(thisPassenger[0].seatDep, directions.departure);
      }

      dispatch(removePassenger(id));
      clickOnRemovePassHandler(id);
   };

   const onFinishFailed = () => {
      setShowError(true);
   };

   const onFinish = (values) => {
      if (values.seatDep) {
         dispatchMaker(values.seatDep, directions.departure, id);
      }
      if (values.seatArr) {
         dispatchMaker(values.seatArr, directions.arrival, id);
      }

      if (!thisPassenger[0]) {
         dispatch(
            addNewPassenger({
               id,
               ...values,
               [fieldNames.dateOfBirth]: values[
                  fieldNames.dateOfBirth
               ]?.format('DD.MM.YYYY'),
            })
         );
      } else {
         dispatch(
            editPassengerData({
               id,
               ...values,
               [fieldNames.dateOfBirth]: values[
                  fieldNames.dateOfBirth
               ]?.format('DD.MM.YYYY'),
            })
         );
      }

      // Скролл к следующему пассажиру
      if (!isLastPassenger) {
         clickOnNextPassHandler(id);
      }
   };

   const fieldChangeHandler = (changedValues, allValues) => {
      // Смена типа пассажира
      if (changedValues[fieldNames.passengerType]) {
         const doc =
            changedValues.passengerType === passengerTypes.adults
               ? docTypes.passport
               : docTypes.birthCertif;
         form.setFieldValue('documentType', doc);
         setDocumentType(doc);
         seatsFilter(
            changedValues.passengerType === passengerTypes.adults ? 1 : 0.5
         );
      }

      // Смена типа документа
      if (changedValues[fieldNames.docType]) {
         setDocumentType(changedValues[fieldNames.docType]);
      }

      // Сброс ошибок
      setTimeout(() => {
         if (
            form.getFieldsError().filter((item) => item.errors.length > 0)
               .length === 0
         ) {
            setShowError(false);
         }
      }, 10);

      // Галочка «только туда»
      if (fieldNames.depOnly in changedValues) {
         setDepartureOnly(changedValues[fieldNames.depOnly]);

         if (form.getFieldValue(fieldNames.seatArr)) {
            dispatchMaker(
               form.getFieldValue(fieldNames.seatArr),
               directions.arrival
            );
            form.setFieldValue(fieldNames.seatArr, null);
         }
      }

      // Проверки по возрасту
      const dob = form.getFieldValue(fieldNames.dateOfBirth);
      if (
         dob &&
         (changedValues.passengerType || changedValues.dateOfBirth) &&
         thisPassenger.length <= 0
      ) {
         setHighAgeError(false);
         setLowAgeError(false);
         setDisabledForwardBtn(false);

         const ageYears = dayjs().diff(dob, 'years');
         const ageChosen = dayjs().diff(dob, 'days') >= 1;

         const pasType = form.getFieldValue(fieldNames.passengerType);
         if (ageChosen && pasType !== passengerTypes.toddlers) {
            if (ageYears < 10 && pasType === passengerTypes.adults) {
               setLowAgeError(true);
               form.setFieldValue(
                  fieldNames.passengerType,
                  passengerTypes.children
               );
               seatsFilter(0.5);
            }

            if (ageYears >= 10 && pasType === passengerTypes.children) {
               setHighAgeError(true);
               form.setFieldValue(
                  fieldNames.passengerType,
                  passengerTypes.adults
               );
               seatsFilter(1);
            }

            if (ageYears >= 14) {
               form.setFieldValue(fieldNames.docType, docTypes.passport);
               setDocumentType(docTypes.passport);
               seatsFilter(1);
            }

            if (
               ageYears < 14 &&
               form.getFieldValue(fieldNames.docType) !== docTypes.birthCertif
            ) {
               form.setFieldValue(fieldNames.docType, docTypes.birthCertif);
               setDocumentType(docTypes.birthCertif);
            }
         }
      }

      // АВТОСОХРАНЕНИЕ пассажира в Redux
      const requiredFields = [
         fieldNames.passengerType,
         fieldNames.lastName,
         fieldNames.firstName,
         fieldNames.fathersName,
         fieldNames.gender,
         fieldNames.dateOfBirth,
         fieldNames.docType,
      ];

      if (allValues[fieldNames.docType] === docTypes.passport) {
         requiredFields.push(
            fieldNames.docSerialNumber,
            fieldNames.docNumberPass
         );
      } else if (allValues[fieldNames.docType] === docTypes.birthCertif) {
         requiredFields.push(fieldNames.docNumberSertif);
      }

      let hasAllRequired = requiredFields.every(
         (f) =>
            allValues[f] !== undefined &&
            allValues[f] !== null &&
            allValues[f] !== ''
      );

      // Не сохраняем, пока не выбраны места (если это не ребёнок без места)
      if (passengerType !== passengerTypes.toddlers) {
         if (unchosenSeatsDepSourse.length > 0 && !allValues[fieldNames.seatDep]) {
            hasAllRequired = false;
         }
         if (unchosenSeatsArrSourse.length > 0 && !departureOnly && !allValues[fieldNames.seatArr]) {
            hasAllRequired = false;
         }
      }

      if (hasAllRequired) {
         const dateValue = allValues[fieldNames.dateOfBirth];
         const dateStr = dateValue?.format
            ? dateValue.format('DD.MM.YYYY')
            : dateValue;

         const formattedValues = {
            ...allValues,
            [fieldNames.dateOfBirth]: dateStr,
         };

         if (thisPassenger[0]) {
            dispatch(editPassengerData({ id, ...formattedValues }));
         } else {
            dispatch(addNewPassenger({ id, ...formattedValues }));
         }
      }

      // АВТОПРИВЯЗКА мест к пассажиру
      if (changedValues[fieldNames.seatDep]) {
         dispatchMaker(
            changedValues[fieldNames.seatDep],
            directions.departure,
            id
         );
      }
      if (changedValues[fieldNames.seatArr]) {
         dispatchMaker(
            changedValues[fieldNames.seatArr],
            directions.arrival,
            id
         );
      }
   };

   const alertMaker = (age) => (
      <Alert
         className={styles.row}
         message={
            age === 'high'
               ? 'Детские билеты доступны только для пассажиров до 10 лет'
               : 'Для пассажиров до 10 лет действует детский тариф'
         }
         type="warning"
      />
   );

   const passengerCardClosed = (
      <button
         type="button"
         onClick={clickOnHeaderHandler}
         className={styles.closedPassengerCard}
      >
         <img src={plusRound} alt="иконка - плюс" />
         <span className={styles.text}>Пассажир {pasNumber}</span>
      </button>
   );

   const passTypeOptions = [
      ...(unchosenSeatsAdults > 0 || thisPassenger[0]?.passengerType === passengerTypes.adults
         ? [{ value: passengerTypes.adults, label: pasTypesRus[passengerTypes.adults] }]
         : []),
      ...(unchosenSeatsChildren > 0 || thisPassenger[0]?.passengerType === passengerTypes.children
         ? [{ value: passengerTypes.children, label: pasTypesRus[passengerTypes.children] }]
         : []),
      ...(passengerType === passengerTypes.toddlers || thisPassenger[0]?.passengerType === passengerTypes.toddlers
         ? [{ value: passengerTypes.toddlers, label: 'Ребёнок без места' }]
         : []),
   ];

   const passType = (
      <Form.Item
         name={fieldNames.passengerType}
         value={form.passengerType}
         rules={rules.passengerType}
      >
         <Select
            className="passengerCard-select"
            classNames={{ popup: { root: 'passengerCard-select' } }}
            options={passTypeOptions}
         />
      </Form.Item>
   );

   const pasTypeToDisplay = (
      <div>
         {thisPassenger[0]?.passengerType === passengerTypes.adults
            ? pasTypesRus[passengerTypes.adults]
            : thisPassenger[0]?.passengerType === passengerTypes.children
            ? pasTypesRus[passengerTypes.children]
            : thisPassenger[0]?.passengerType === passengerTypes.toddlers
            ? 'Ребёнок без места'
            : 'Тип неопределен'}
      </div>
   );

   const fullNameInputFields = (
      <>
         <Form.Item
            name={fieldNames.lastName}
            label={fieldNames.lastNameLabel}
            rules={rules.lastName}
            normalize={(value) => value?.toLowerCase()}
         >
            <Input
               className={`${styles.inputField} passengerCard-input`}
               allowClear
            />
         </Form.Item>
         <Form.Item
            name={fieldNames.firstName}
            label={fieldNames.firstNameLabel}
            rules={rules.firstName}
            normalize={(value) => value?.toLowerCase()}
         >
            <Input
               className={`${styles.inputField} passengerCard-input`}
               allowClear
            />
         </Form.Item>
         <Form.Item
            name={fieldNames.fathersName}
            label={fieldNames.fathersNameLabel}
            rules={rules.fathersName}
            normalize={(value) => value?.toLowerCase()}
         >
            <Input
               className={`${styles.inputField} passengerCard-input`}
               allowClear
            />
         </Form.Item>
      </>
   );

   const sexRadioGroup = (
      <Form.Item
         label={fieldNames.genderLabel}
         name={fieldNames.gender}
         className={styles.genderRadioBtn}
         rules={rules.gender}
      >
         <Radio.Group
            optionType="button"
            buttonStyle="solid"
            className="passengerCard-radio"
         >
            <Radio.Button value="true" defaultChecked>
               М
            </Radio.Button>
            <Radio.Button value="false">Ж</Radio.Button>
         </Radio.Group>
      </Form.Item>
   );

   const dateOfBirthPicker = (
      <ConfigProvider locale={ru_RU}>
         <Form.Item
            label={fieldNames.dateOfBirthLabel}
            name={fieldNames.dateOfBirth}
            rules={rules.dateOfBirth}
            value={form.dateOfBirth}
         >
            <DatePicker
              className="passengerCard-datepicker"
              classNames={{ popup: { root: 'passengerCard-datepicker' } }}
              placeholder="дд.мм.гггг"
              disabledDate={disabledDate}
              format={{ format: 'DD.MM.YYYY', type: 'mask' }} // <-- Маска включена
              allowClear
              showToday={false}
            />
         </Form.Item>
      </ConfigProvider>
   );

   const specialNeedsCheckbox = (
      <Form.Item valuePropName="checked" name={fieldNames.specialNeeds}>
         <Checkbox className="passengerCard-checkbox">
            {fieldNames.specialNeedsLabel}
         </Checkbox>
      </Form.Item>
   );

   const docTypeOptions = [
      ...(dayjs().diff(
         form.getFieldValue(fieldNames.dateOfBirth),
         'years'
      ) >= 14 ||
      dayjs().diff(form.getFieldValue(fieldNames.dateOfBirth), 'days') <= 0
         ? [{ value: docTypes.passport, label: docTypes.passportRus }]
         : []),
      { value: docTypes.birthCertif, label: docTypes.birthCertifRus },
   ];

   const docTypeSelect = (
      <Form.Item
         label={fieldNames.docTypeLabel}
         name={fieldNames.docType}
         className={styles.documentType}
         rules={rules.docType}
      >
         <Select
            className={docTypeselectClasses}
            classNames={{ popup: { root: 'passengerCard-doc-select' } }}
            allowClear={false}
            options={docTypeOptions}
         />
      </Form.Item>
   );

   const passSerNum = (
      <Form.Item
         label={fieldNames.docSerialNumberLabel}
         name={fieldNames.docSerialNumber}
         className={styles.documentType}
         rules={rules.docSerialNumber}
      >
         <InputNumber
            placeholder="_ _ _ _"
            className={styles.inputFieldPassport}
            controls={false}
         />
      </Form.Item>
   );

   const passNum = (
      <Form.Item
         label={fieldNames.docNumberPassLabel}
         name={fieldNames.docNumberPass}
         className={styles.documentType}
         rules={rules.docNumberPass}
      >
         <InputNumber
            placeholder="_ _ _ _ _ _"
            className={styles.inputFieldPassport}
            controls={false}
         />
      </Form.Item>
   );

   const birthCertif = (
      <Form.Item
         label={fieldNames.docNumberSertifLabel}
         name={fieldNames.docNumberSertif}
         className={styles.documentType}
         rules={rules.docNumberSertif}
      >
         <Input
            placeholder="12 символов"
            className={styles.inputFieldBirthSertif}
         />
      </Form.Item>
   );

   const seatDep = (
      <Form.Item
         label={fieldNames.seatDepLabel}
         name={fieldNames.seatDep}
         className={styles.documentType}
         rules={rules.seatDep}
      >
         <Select
            className="passengerCard-seat-select"
            allowClear={false}
            options={unchosenSeatsDepSourse?.map((item) => ({
               value: `${item.coachId}:${item.seat}`,
               label: `Вагон: ${item.coachName}, место: ${item.seat}`,
            }))}
         />
      </Form.Item>
   );

   const depOnly = (
      <Form.Item
         className={`${styles.departureOnly} passengerCard-checkbox-departureOnly`}
         valuePropName="checked"
         name={fieldNames.depOnly}
         label={fieldNames.depOnlyLabel}
      >
         <Checkbox className="passengerCard-checkbox-departureOnly" />
      </Form.Item>
   );

   const seatArr = (
      <Form.Item
         label={fieldNames.seatArrLabel}
         name={fieldNames.seatArr}
         className={styles.documentType}
         rules={rules.seatArr}
      >
         {unchosenSeatsArrSourse.length > 0 && (
            <Select
               className="passengerCard-seat-select"
               allowClear={false}
               options={unchosenSeatsArrSourse?.map((item) => ({
                  value: `${item.coachId}:${item.seat}`,
                  label: `Вагон: ${item.coachName}, место: ${item.seat}`,
               }))}
            />
         )}
      </Form.Item>
   );

   const seatSelection = (
      <>
         {unchosenSeatsDepSourse.length > 0 && seatDep}

         {unchosenSeatsArrSourse.length > 0 &&
            unchosenSeatsDepSourse.length > 0 &&
            depOnly}

         {unchosenSeatsArrSourse.length > 0 && !departureOnly && seatArr}
      </>
   );

   const linkToSeatsPage = (
      <Link to={links.seats}>
         <span className={styles.link}>страницу выбора мест</span>
      </Link>
   );

   const needMoreSeatsText = (
      <div>
         <span>{`Нужен еще один
         ${
            form.getFieldValue(fieldNames.passengerType) ===
            passengerTypes.adults
               ? pasTypesRus[passengerTypes.adults].toLowerCase()
               : pasTypesRus[passengerTypes.children].toLowerCase()
         } билет? Пожалуйста, вернитесь на `}</span>
         <span> {linkToSeatsPage}</span>
         <span> и выберите дополнительное место на схеме вагона</span>
      </div>
   );

   useEffect(() => {
      if (passengerType === passengerTypes.toddlers) {
         setDisabledForwardBtn(false);
         return;
      }
      if (
         thisPassenger.length === 0 &&
         unchosenSeatsDepSourse.length === 0 &&
         unchosenSeatsArrSourse.length === 0
      ) {
         setDisabledForwardBtn(true);
      } else {
         setDisabledForwardBtn(false);
      }
   }, [
      thisPassenger.length,
      unchosenSeatsArrSourse.length,
      unchosenSeatsDepSourse.length,
      passengerType,
   ]);

   const seatSelBlock = (
      <div className={`${styles.row} ${styles.rowSeats}`}>
         {((thisPassenger.length === 0 &&
            (unchosenSeatsDepSourse.length > 0 ||
               unchosenSeatsArrSourse.length > 0)) ||
            (thisPassenger.length > 0 &&
               !thisPassenger[0].seatDep &&
               !thisPassenger[0].seatArr)) &&
            passengerType !== passengerTypes.toddlers &&
            seatSelection}
         {passengerType === passengerTypes.toddlers && (
            <div>
               Ребёнок без места едет вместе с взрослым пассажиром. Выбирать
               место для него не нужно.
            </div>
         )}
         {thisPassenger.length === 0 &&
            unchosenSeatsDepSourse.length === 0 &&
            unchosenSeatsArrSourse.length === 0 &&
            passengerType !== passengerTypes.toddlers &&
            needMoreSeatsText}
         {thisPassenger.length > 0 &&
            (thisPassenger[0].seatDep || thisPassenger[0].seatArr) && (
               <div>{seatInfo}</div>
            )}
      </div>
   );

   const buttonLabel = isLastPassenger ? 'Готово' : 'Следующий пассажир';

   const button = (
      <Form.Item className={bottomSectionStyles}>
         {!thisPassenger[0] && !disabledForwardBtn && (
            <Button
               type="primary"
               htmlType="submit"
               className="passengerCard__button"
               disabled={disabledForwardBtn}
            >
               {buttonLabel}
            </Button>
         )}
         {thisPassenger[0] && (
            <button type="submit" className={styles.changeButton}>
               Сохранить изменения
            </button>
         )}
      </Form.Item>
   );

   return (
      <div id={id} ref={title}>
         {!expanded && passengerCardClosed}
         {expanded && (
            <div className={styles.passengerCard}>
               <div
                  tabIndex="0"
                  role="button"
                  className={`${styles.passengerCard__header} ${styles.section}`}
                  onClick={clickOnHeaderHandler}
               >
                  <div className={styles.left}>
                     <img src={minusRound} alt="иконка - минус" />
                     <span className={styles.text}>Пассажир {pasNumber}</span>
                  </div>
                  <button type="button" onClick={clickOnRemoveCardHandler}>
                     <img src={cross} alt="иконка - крестик" />
                  </button>
               </div>

               <Form
                  form={form}
                  initialValues={initialValues}
                  layout="vertical"
                  onFinish={onFinish}
                  onFinishFailed={onFinishFailed}
                  onValuesChange={fieldChangeHandler}
                  scrollToFirstError
               >
                  <div className={styles.section}>
                     <div className={styles.row}>
                        {!thisPassenger[0] && passType}
                        {thisPassenger[0] && pasTypeToDisplay}
                     </div>
                     <div className={styles.row}>{fullNameInputFields}</div>
                     <div className={`${styles.row} ${styles.rowShort}`}>
                        {sexRadioGroup}
                        {dateOfBirthPicker}
                     </div>
                     {highAgeError && alertMaker('high')}
                     {lowAgeError && alertMaker('low')}
                     <div className={styles.row}>{specialNeedsCheckbox}</div>
                  </div>
                  <div className={styles.section}>
                     <div className={`${styles.row} ${styles.rowShort}`}>
                        {docTypeSelect}
                        {documentType === docTypes.passport && passSerNum}
                        {documentType === docTypes.passport && passNum}
                        {documentType === docTypes.birthCertif && birthCertif}
                     </div>
                  </div>
                  <div className={styles.section}>{seatSelBlock}</div>
                  {((!thisPassenger[0] && !disabledForwardBtn) ||
                     thisPassenger[0]) &&
                     button}
               </Form>
            </div>
         )}
      </div>
   );
}

const shapedObj = {
   coachId: PropTypes.string.isRequired,
   coachName: PropTypes.string.isRequired,
   passengerId: PropTypes.string,
   price: PropTypes.number.isRequired,
   priceCoefficient: PropTypes.number.isRequired,
   seat: PropTypes.number.isRequired,
};

PassengerCard.propTypes = {
   passengerType: PropTypes.string.isRequired,
   pasNumber: PropTypes.number.isRequired,
   clickOnRemovePassHandler: PropTypes.func.isRequired,
   clickOnNextPassHandler: PropTypes.func.isRequired,
   id: PropTypes.string.isRequired,
   unchosenSeats: PropTypes.arrayOf(PropTypes.shape(shapedObj)).isRequired,
   unchosenSeatsDep: PropTypes.arrayOf(PropTypes.shape(shapedObj)).isRequired,
   unchosenSeatsArr: PropTypes.arrayOf(PropTypes.shape(shapedObj)),
   isLastPassenger: PropTypes.bool,
};

PassengerCard.defaultProps = {
   unchosenSeatsArr: null,
   isLastPassenger: false,
};

export default PassengerCard;
