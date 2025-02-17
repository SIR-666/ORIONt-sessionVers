export const adjustDowntimes = (stoppageData, allPO, line) => {
    const adjustedDowntimes = [];
    const processedDowntimes = new Set();
  
    stoppageData.forEach((entry) => {
      const downtimeStart = new Date(entry.Date).toISOString();
      const downtimeEnd = new Date(downtimeStart);
      downtimeEnd.setMinutes(downtimeEnd.getMinutes() + parseInt(entry.Minutes));
      const downtimeEndUTC = downtimeEnd.toISOString();
      console.log("Filling Downtime:", downtimeStart, downtimeEndUTC);

      let overlapFound = false;
      let closestOrder = null;
      let closestOrderTimeDifference = Number.MAX_SAFE_INTEGER;
  
      (allPO || [])
            .filter((order) => order.line === line)
            .forEach((order) => {
                // Convert PO start and end to UTC
                const orderStart = new Date(order.actual_start).toISOString();
                const orderEnd = order.actual_end ? new Date(order.actual_end).toISOString() : new Date().toISOString();

                console.log("Checking PO (UTC):", orderStart, orderEnd);

                // Check for overlap
                if (downtimeStart < orderEnd && downtimeEndUTC > orderStart) {
                    overlapFound = true;
                    console.log("Found overlap");
                    console.log('Comparing: ', downtimeStart, downtimeEndUTC, orderStart, orderEnd);
                    const overlapStart = downtimeStart > orderStart ? downtimeStart : orderStart;
                    const overlapEnd = downtimeEndUTC < orderEnd ? downtimeEndUTC : orderEnd;
                    const overlapDuration = (new Date(overlapEnd) - new Date(overlapStart)) / 60000; // duration in minutes

                    console.log("Found Overlap (UTC):", overlapStart, overlapEnd, overlapDuration);

                    const uniqueKey = `${downtimeStart}-${downtimeEndUTC}-${order.id}`;

                    if (!processedDowntimes.has(uniqueKey)) {
                      adjustedDowntimes.push({
                          id: entry.id,
                          orderId: order.id,
                          adjustedStart: overlapStart,
                          adjustedEnd: overlapEnd,
                          duration: overlapDuration,
                          Mesin: entry.Mesin,
                          Jenis: entry.Jenis,
                          comments: entry.Keterangan,
                          category: entry.Downtime_Category,
                          group: entry.Group,
                          lastReported: entry.datesystem,
                      });

                      // Mark this downtime as processed
                      processedDowntimes.add(uniqueKey);
                    }
                }
                const timeDifference = Math.min(
                  Math.abs(new Date(downtimeStart) - new Date(orderStart)),
                  Math.abs(new Date(downtimeEndUTC) - new Date(orderEnd))
                );
                if (timeDifference < closestOrderTimeDifference) {
                  closestOrderTimeDifference = timeDifference;
                  closestOrder = order;
                }
            });
        if (!overlapFound) {
          const fallbackOrderId = closestOrder ? closestOrder.id : null;
          const uniqueKey = `${downtimeStart}-${downtimeEndUTC}-${fallbackOrderId}`;
          if (!processedDowntimes.has(uniqueKey)) {
            adjustedDowntimes.push({
                id: entry.id,
                orderId: fallbackOrderId,
                adjustedStart: downtimeStart,
                adjustedEnd: downtimeEndUTC,
                duration: entry.Minutes,
                Mesin: entry.Mesin,
                Jenis: entry.Jenis,
                comments: entry.Keterangan,
                category: entry.Downtime_Category,
                group: entry.Group,
                lastReported: entry.datesystem,
            });

            // Mark this downtime as processed
            processedDowntimes.add(uniqueKey);
          }
        }
    });
    console.log("Adjusted Downtimes Result:", adjustedDowntimes);
    return adjustedDowntimes;
  };