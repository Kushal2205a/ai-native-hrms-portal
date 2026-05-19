'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import {
    getAvailableInterviewSlots,
    scheduleInterview,
} from '@/lib/actions/interviews';
import Portal from '@/components/shared/Portal';

type InterviewSlot = {
    startsAt: string;
    endsAt: string;
    label: string;
};

interface InterviewSlotPickerProps {
    applicationId: string;
}

function getDateKey(value: string) {
    return new Date(value).toISOString().slice(0, 10);
}

function formatDay(value: string) {
    return new Date(value).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}

function formatTime(value: string) {
    return new Date(value).toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

export default function InterviewSlotPicker({
    applicationId,
}: InterviewSlotPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [slots, setSlots] = useState<InterviewSlot[]>([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;

        async function loadSlots() {
            setError('');
            setSuccess('');
            setIsLoadingSlots(true);

            try {
                const availableSlots = await getAvailableInterviewSlots(applicationId);

                if (!isMounted) return;

                setSlots(availableSlots);

                const firstSlot = availableSlots[0];

                if (firstSlot) {
                    setSelectedDate(getDateKey(firstSlot.startsAt));
                }
            } catch (err) {
                if (!isMounted) return;

                setError(
                    err instanceof Error
                        ? err.message
                        : 'Could not load interview slots.'
                );
            } finally {
                if (isMounted) {
                    setIsLoadingSlots(false);
                }
            }
        }

        loadSlots();

        return () => {
            isMounted = false;
        };
    }, [applicationId, isOpen]);

    const availableDates = useMemo(() => {
        const uniqueDates = new Map<string, string>();

        slots.forEach((slot) => {
            const dateKey = getDateKey(slot.startsAt);

            if (!uniqueDates.has(dateKey)) {
                uniqueDates.set(dateKey, slot.startsAt);
            }
        });

        return Array.from(uniqueDates.entries()).map(([dateKey, startsAt]) => ({
            dateKey,
            label: formatDay(startsAt),
        }));
    }, [slots]);

    const slotsForSelectedDate = useMemo(() => {
        return slots.filter((slot) => getDateKey(slot.startsAt) === selectedDate);
    }, [slots, selectedDate]);

    function handleOpen() {
        setIsOpen(true);
        setSelectedSlot('');
        setError('');
        setSuccess('');
    }

    function handleClose() {
        if (isPending) return;

        setIsOpen(false);
        setSelectedSlot('');
        setError('');
        setSuccess('');
    }

    function handleSchedule() {
        if (!selectedSlot) {
            setError('Choose a time slot first.');
            return;
        }

        setError('');
        setSuccess('');

        startTransition(async () => {
            try {
                await scheduleInterview({
                    applicationId,
                    startsAt: selectedSlot,
                });

                setSuccess('Interview scheduled.');
                setTimeout(() => {
                    setIsOpen(false);
                }, 700);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : 'Could not schedule interview.'
                );
            }
        });
    }

    return (
        <>
            <button
                type="button"
                className="candidate-interview-trigger"
                onClick={handleOpen}
            >
                Choose interview slot
            </button>

            {isOpen ? (
                <Portal>
                    <div className="interview-dialog-backdrop" role="presentation">
                        <div
                            className="interview-dialog"
                            role="dialog"
                            aria-modal="true"
                            aria-label="Choose interview slot"
                        >
                            <div className="interview-dialog-header">
                                <div>
                                    <p className="s-tag interview-dialog-tag">Interview</p>
                                    <h2 className="interview-dialog-title">
                                        Choose interview slot
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    className="interview-dialog-close"
                                    onClick={handleClose}
                                    aria-label="Close"
                                >
                                    ×
                                </button>
                            </div>

                            {isLoadingSlots ? (
                                <p className="candidate-interview-note">
                                    Loading available slots...
                                </p>
                            ) : null}

                            {!isLoadingSlots && !slots.length ? (
                                <p className="candidate-interview-note">
                                    No available slots right now. Please check again later.
                                </p>
                            ) : null}

                            {!isLoadingSlots && slots.length ? (
                                <>
                                    <div className="interview-date-row">
                                        {availableDates.map((date) => (
                                            <button
                                                key={date.dateKey}
                                                type="button"
                                                className={
                                                    selectedDate === date.dateKey
                                                        ? 'interview-date-option interview-date-option--active'
                                                        : 'interview-date-option'
                                                }
                                                onClick={() => {
                                                    setSelectedDate(date.dateKey);
                                                    setSelectedSlot('');
                                                }}
                                            >
                                                {date.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="interview-time-section">
                                        <p className="interview-time-label">Available times</p>

                                        <div className="interview-time-grid">
                                            {slotsForSelectedDate.map((slot) => (
                                                <button
                                                    key={slot.startsAt}
                                                    type="button"
                                                    className={
                                                        selectedSlot === slot.startsAt
                                                            ? 'interview-time-option interview-time-option--active'
                                                            : 'interview-time-option'
                                                    }
                                                    onClick={() => setSelectedSlot(slot.startsAt)}
                                                >
                                                    {formatTime(slot.startsAt)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : null}

                            {error ? <p className="form-error">{error}</p> : null}
                            {success ? <p className="form-success">{success}</p> : null}

                            <div className="interview-dialog-actions">
                                <button
                                    type="button"
                                    className="btn-ghost"
                                    onClick={handleClose}
                                    disabled={isPending}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className="btn-g"
                                    disabled={isPending || !selectedSlot}
                                    onClick={handleSchedule}
                                >
                                    {isPending ? 'Scheduling...' : 'Confirm slot'}
                                </button>
                            </div>
                        </div>
                    </div>
                </Portal>
            ) : null}
        </>
    );
}