import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import PropTypes from 'prop-types';

import { Popover } from 'antd';

import {
   addSelectedSeats,
   removeSelectedSeat,
} from '../../../../../../../store/slices/seatsSlice';
import { selectNumberOfPassengers } from '../../../../../../../store/slices/numOfpassengersSlice';
import { removeSeatInfoAfterUnchoosingSeat } from '../../../../../../../store/slices/passengersSlice';

import passengerTypes from '../../../../passengerTypes';

import styles from './SeatItem.module.scss';
import './Popover.scss';

function SeatItem({
   number,
   coachClass,
   taken,
   direction,
   coachId,
   coachName,
   price,
   chosenSeat,
   adultSeats,
   childrenSeats,
   typeOfPassenger,
}) {
   const dispatch = useDispatch();
   const [chosen, setChosen] = useState(chosenSeat);
   const [clicked, setClicked] = useState(false);
   const [open, setOpen] = useState(false);

   const numberOfPassengers = useSelector(selectNumberOfPassengers)[direction];
   const numOfAdults = numberOfPassengers?.adults || 0;
   const numOfChildren = numberOfPassengers?.children || 0;

   // Проверяем, все ли места для указанных пассажиров уже выбраны
   const isMaxReached = numOfAdults <= adultSeats && numOfChildren <= childrenSeats;

   // Синхронизация локального стейта, если место сняли из другого компонента
   useEffect(() => {
      setChosen(chosenSeat);
   }, [chosenSeat]);

   let className = `${styles[`seat-${coachClass}`]} ${styles.seat} ${
      taken && styles['seat-taken']
   } ${chosen && styles['seat-chosen']} ${clicked && styles['seat-clicked']}`;


   const seatClickHandler = () => {
      if (taken) return;

      if (chosen) {
         // Снять выбор
         setChosen(false);
         setClicked(false);
         setOpen(false);
         dispatch(removeSelectedSeat({ number, direction, coachId }));
         dispatch(
            removeSeatInfoAfterUnchoosingSeat({ coachId, seatNumber: number })
         );
      } else {
         // Если мест для пассажиров уже достаточно — не открываем поповер
         if (isMaxReached) return;
         setClicked(true);
         setOpen(true);
      }
   };

   const typeClickHandler = (evt) => {
      dispatch(
         addSelectedSeats({
            number,
            direction,
            coachId,
            coachName,
            price,
            priceCoefficient: evt.target.id === passengerTypes.adults ? 1 : 0.5,
         })
      );
      setChosen(true);
      setClicked(false);
      setOpen(false);
   };

   const popoverContent = (
      <>
         {numOfAdults > adultSeats && (
            <button
               type="button"
               id={passengerTypes.adults}
               onClick={typeClickHandler}
            >
               взрослый
            </button>
         )}
         {numOfChildren > childrenSeats && (
            <button
               type="button"
               id={passengerTypes.children}
               onClick={typeClickHandler}
            >
               ребенок
            </button>
         )}
         {isMaxReached && (
            <span>вы выбрали максимальное количество мест</span>
         )}
      </>
   );

   let visibleSeatNum;

   switch (typeOfPassenger) {
      case passengerTypes.adults:
         visibleSeatNum = 'B';
         break;
      case passengerTypes.children:
         visibleSeatNum = 'P';
         break;
      default:
         visibleSeatNum = number;
   }

   return (
      <>
         {!taken && (
            <Popover
               classNames={{ root: 'seatItem' }}
               placement="top"
               title="Кто поедет на этом месте?"
               trigger="click"
               content={popoverContent}
               open={open}
            >
               <button
                  onClick={seatClickHandler}
                  type="button"
                  className={className}
                  disabled={taken}
               >
                  {visibleSeatNum}
               </button>
            </Popover>
         )}
         {taken && (
            <button
               onClick={seatClickHandler}
               type="button"
               className={className}
               disabled={taken}
            >
               {number}
            </button>
         )}
      </>
   );
}

SeatItem.propTypes = {
   number: PropTypes.number.isRequired,
   price: PropTypes.number.isRequired,
   coachClass: PropTypes.string.isRequired,
   taken: PropTypes.bool.isRequired,
   coachId: PropTypes.string,
   coachName: PropTypes.string.isRequired,
   direction: PropTypes.string.isRequired,
   chosenSeat: PropTypes.bool.isRequired,
   adultSeats: PropTypes.number.isRequired,
   childrenSeats: PropTypes.number.isRequired,
   typeOfPassenger: PropTypes.string.isRequired,
};

SeatItem.defaultProps = {
   coachId: null,
};

export default SeatItem;
