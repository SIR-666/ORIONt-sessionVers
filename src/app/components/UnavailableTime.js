export function calculateUnavailableTime(
    initialData,
    allPO,
    stoppageData, 
    shiftStart,
    shiftEnd,
    durationSums
  ) {
    const shiftStartLocal = new Date(shiftStart);
    const shiftEndLocal = new Date(shiftEnd);
    let unavailableTime = 0; // Declare this outside the loop to return the final value

    const calculateEndTime = (start, duration) => {
      const startTime = new Date(start);
      const durationMinutes = parseInt(duration, 10);
      
      const endDate = new Date(startTime.getTime() + durationMinutes * 60000);
    
      return endDate.toISOString();
    }
  
    initialData.forEach((entry) => {
      const startPO = new Date(entry.actual_start);
      const endPO = entry.actual_end ? new Date(entry.actual_end) : new Date();
      startPO.setHours(startPO.getHours() - 7);
      if (entry.actual_end) {
        endPO.setHours(endPO.getHours() - 7); 
      }
  
      let currentGapTime = 0; // Use this to calculate gaps for each entry separately
  
      // Filter POs that fall within the shift
      const poInShift = allPO
        .filter((po) => {
          const poStart = new Date(po.actual_start);
          const poEnd = po.actual_end ? new Date(po.actual_end) : new Date();
          poStart.setHours(poStart.getHours() - 7);
          if (po.actual_end) {
            poEnd.setHours(poEnd.getHours() - 7); 
          }
  
          // Check if PO falls within or spans the shift time range
          return (
            (poStart >= shiftStartLocal && poStart < shiftEndLocal) || // PO starts within shift
            (poEnd > shiftStartLocal && poEnd <= shiftEndLocal) || // PO ends within shift
            (poStart < shiftStartLocal && poEnd > shiftEndLocal) // PO spans the shift entirely
          );
        })
        .sort((a, b) => new Date(a.actual_start) - new Date(b.actual_start)); // Sort by start time
  
        // console.log("PO in shift: ", poInShift);
      let previousPOEnd = shiftStartLocal;
  
      // Calculate gaps between POs
      poInShift.forEach((po) => {
        const poStart = new Date(po.actual_start);
        const poEnd = po.actual_end ? new Date(po.actual_end) : new Date();
        poStart.setHours(poStart.getHours() - 7);
        if (po.actual_end) {
          poEnd.setHours(poEnd.getHours() - 7); 
        }

        const hasDowntimeInGap = stoppageData.some((downtime) => {
          const downtimeStart = new Date(downtime.Date);
          downtimeStart.setHours(downtimeStart.getHours() - 7);
          const downtimeEnd = new Date(calculateEndTime(downtime.Date, downtime.Minutes));
          downtimeEnd.setHours(downtimeEnd.getHours() - 7);
          return (
            (downtimeStart >= previousPOEnd && downtimeStart < poStart) || 
            (downtimeEnd > previousPOEnd && downtimeEnd <= poStart)
          );
        });
  
        // Add gap time if current PO starts after the previous PO ends
        if (!hasDowntimeInGap && poStart > previousPOEnd) {
          currentGapTime += poStart - previousPOEnd;
        }
  
        previousPOEnd = Math.max(previousPOEnd, poEnd);
      });
  
      // Handle edge cases where the first or last PO doesn't start or end at shift boundaries
      if (poInShift.length > 1) {
        const earliestPOStart = new Date(poInShift[0].actual_start);
        earliestPOStart.setHours(earliestPOStart.getHours() - 7); // Adjust to local time
        if (earliestPOStart > shiftStartLocal && previousPOEnd === shiftStartLocal) {
          currentGapTime += earliestPOStart - shiftStartLocal;
        }
      }
  
      const hasDowntimeAfterLastPO = stoppageData.some((downtime) => {
        const downtimeStart = new Date(downtime.Date);
        downtimeStart.setHours(downtimeStart.getHours() - 7);
        const downtimeEnd = new Date(calculateEndTime(downtime.Date, downtime.Minutes));
        downtimeEnd.setHours(downtimeEnd.getHours() - 7);
        return (
          (downtimeStart >= previousPOEnd && downtimeStart < shiftEndLocal) || 
          (downtimeEnd > previousPOEnd && downtimeEnd <= shiftEndLocal)
        );
      });

      if (!hasDowntimeAfterLastPO && poInShift.length > 1) {
        const latestPOEnd = poInShift[poInShift.length - 1].actual_end
        ? new Date(poInShift[poInShift.length - 1].actual_end)
        : new Date();
        if (poInShift[poInShift.length - 1].actual_end) {
          latestPOEnd.setHours(latestPOEnd.getHours() - 7); // Adjust to local time 
        }
        if (latestPOEnd < shiftEndLocal && latestPOEnd !== previousPOEnd) {
          currentGapTime += shiftEndLocal - latestPOEnd;
        }
      } else if (!hasDowntimeAfterLastPO && poInShift.length === 1) {
        const singlePOEnd = poInShift[0].actual_end
        ? new Date(poInShift[0].actual_end)
        : new Date();
        if (poInShift[0].actual_end) {
          singlePOEnd.setHours(singlePOEnd.getHours() - 7); // Adjust to local time 
        }
        if (singlePOEnd < shiftEndLocal) {
          currentGapTime += shiftEndLocal - singlePOEnd;
        }
      }
  
      // Calculate final unavailable time for the entry
      if (startPO >= shiftStartLocal && startPO < shiftEndLocal) {
        unavailableTime += currentGapTime;
      } else if (startPO < shiftStartLocal && endPO > shiftStartLocal) {
        unavailableTime += currentGapTime; // Spans from previous shift
      }
    });
  
    // Convert total gap time from milliseconds to minutes
    const unavailableTimeInMinutes = (unavailableTime / 1000 / 60) + durationSums.UnavailableTime;
  
    return { unavailableTime, unavailableTimeInMinutes };
  }  