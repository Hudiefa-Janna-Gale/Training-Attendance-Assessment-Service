import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { RecordAttendanceDto } from '../../attendance/dto/record-attendance.dto.js';
import { SubmitScoreDto } from '../../assessments/dto/submit-score.dto.js';

// What a RabbitMQ request carries besides the body the HTTP API takes: the id that HTTP puts in the
// path. An id is only looked up, never stored, so it is not held to the id pattern: an unknown one
// is a 404 ("no such session"), as it is over HTTP.

export class SessionRefDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  session_id: string;
}

export class AssessmentRefDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  assessment_id: string;
}

export class RecordAttendanceRequestDto extends RecordAttendanceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  session_id: string;
}

export class SubmitScoreRequestDto extends SubmitScoreDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  assessment_id: string;
}

export class ResultRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  participant_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  workshop_id: string;
}
